import db from '@/util/database';
import AssetPoolService from '@/services/AssetPoolService';
import AccountProxy from '@/proxies/AccountProxy';
import Web3 from 'web3';
import { MONGODB_URI } from '@/config/secrets';
import { getContract } from '@/config/contracts';
import { updateDiamondContract } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { AccountPlanType, ChainId } from '@/types/enums';
import { ContractName, currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import { HARDHAT_RPC, POLYGON_MUMBAI_RPC, POLYGON_RPC, PRIVATE_KEY } from '@/config/secrets';
import { getDiamondAbi } from '@/config/contracts';
import { getProvider } from '@/util/network';
import { logger } from '@/util/logger';
import { toChecksumAddress } from 'web3-utils';

db.connect(MONGODB_URI);

const networks: any = {};
if (HARDHAT_RPC) {
    networks[ChainId.Hardhat] = (() => {
        const web3 = new Web3(HARDHAT_RPC);
        return { web3, admin: web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY) };
    })();
}

if (POLYGON_MUMBAI_RPC) {
    networks[ChainId.PolygonMumbai] = (() => {
        const web3 = new Web3(POLYGON_MUMBAI_RPC);
        return { web3, admin: web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY) };
    })();
}

if (POLYGON_RPC) {
    networks[ChainId.Polygon] = (() => {
        const web3 = new Web3(POLYGON_RPC);
        return { web3, admin: web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY) };
    })();
}

const send = async (web3: Web3, to: string, fn: any) => {
    const [from] = await web3.eth.getAccounts();
    const data = fn.encodeABI();
    const gas = await fn.estimateGas({ from });
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(from, 'pending');
    const sig = await web3.eth.accounts.signTransaction(
        {
            gas,
            to,
            from,
            data,
            nonce,
            gasPrice,
        },
        PRIVATE_KEY,
    );
    try {
        const receipt = await web3.eth.sendSignedTransaction(sig.rawTransaction);
        logger.debug(receipt.transactionHash);
    } catch (error) {
        logger.debug(error);
    }
};

async function main() {
    const startTime = Date.now();
    console.log('Start!', startTime);
    const diamonds: Partial<Record<ContractName, DiamondVariant>> = {
        Registry: 'registry',
        Factory: 'factory',
    };

    for (const [contractName, diamondVariant] of Object.entries(diamonds)) {
        for (const chainId of [ChainId.PolygonMumbai, ChainId.Polygon]) {
            try {
                const contract = getContract(chainId, contractName as ContractName);
                const tx = await updateDiamondContract(chainId, contract, diamondVariant);
                if (tx) console.log(`Upgraded: ${contractName} (${ChainId[chainId]}):`, currentVersion);
            } catch (error) {
                console.error(error);
            }
        }
    }

    for (const pool of await AssetPool.find({ version: { $ne: currentVersion } })) {
        try {
            const account = await AccountProxy.getById(pool.sub);
            if (!account) return;

            const isPaidPlan = [AccountPlanType.Basic, AccountPlanType.Premium].includes(account.plan);
            const isFreeMumbai = account.plan === AccountPlanType.Free && pool.chainId === ChainId.PolygonMumbai;

            if (isPaidPlan || isFreeMumbai) {
                // create provider for chain with PRIVATE_KEY
                const oldProvider = networks[pool.chainId];
                // get new provider for chain with getProvider()
                const newProvider = getProvider(pool.chainId);
                const { methods } = new oldProvider.web3.eth.Contract(
                    getDiamondAbi(pool.chainId, 'defaultDiamond'),
                    pool.address,
                );

                const currentOwner = toChecksumAddress(await methods.owner().call());
                const newOwner = toChecksumAddress(newProvider.defaultAccount);

                if (currentOwner !== newOwner) {
                    logger.debug('TransferOwnership:', pool.address, `${currentOwner} -> ${newOwner}`);
                    await send(oldProvider.web3, pool.address, methods.transferOwnership(newOwner));
                }

                logger.debug('Upgrade:', pool.address, `${pool.variant} ${pool.version} -> ${currentVersion}`);
                await AssetPoolService.updateAssetPool(pool, currentVersion);

                const currentRegistryAddress = toChecksumAddress(await pool.contract.methods.getRegistry().call());
                const registryAddress = toChecksumAddress(
                    getContract(pool.chainId, 'Registry', currentVersion).options.address,
                );

                if (registryAddress !== currentRegistryAddress) {
                    logger.debug('SetRegistry:', pool.address, `${currentRegistryAddress} -> ${registryAddress}`);
                    await send(newProvider.web3, pool.address, methods.setRegistry(registryAddress));
                }
            }
        } catch (error) {
            console.error(pool.address, error);
        }
    }

    const endTime = Date.now();
    console.log('Done!', startTime, endTime, endTime - startTime);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
