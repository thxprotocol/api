import db from '@/util/database';
import AssetPoolService, { ADMIN_ROLE } from '@/services/AssetPoolService';
import AccountProxy from '@/proxies/AccountProxy';
import Web3 from 'web3';
import { MONGODB_URI } from '@/config/secrets';
import { getAbiForContractName, getContract } from '@/config/contracts';
import { updateDiamondContract } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { AccountPlanType, ChainId } from '@/types/enums';
import { ContractName, currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import { HARDHAT_RPC, POLYGON_MUMBAI_RPC, POLYGON_RPC, PRIVATE_KEY } from '@/config/secrets';
import { getDiamondAbi } from '@/config/contracts';
import { getProvider } from '@/util/network';
import { logger } from '@/util/logger';
import { toChecksumAddress } from 'web3-utils';
import TransactionService from '@/services/TransactionService';
// import { BigNumber } from 'ethers/lib/ethers';

// const multiplier = BigNumber.from('10').pow(15);
// const twoHalfPercent = BigNumber.from('25').mul(multiplier);

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

const send = async (web3: Web3, to: string, fn: any, from: string) => {
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

// const getFeeCollector = (chainId: ChainId) => {
//     const collectors: any = {};
//     collectors[ChainId.PolygonMumbai] = '0x960911a62FdDf7BA84D0d3aD016EF7D15966F7Dc';
//     collectors[ChainId.Polygon] = '0x960911a62FdDf7BA84D0d3aD016EF7D15966F7Dc';
//     // collectors[ChainId.PolygonMumbai] = '0x2e2fe80CD6C4933B3B97b4c0B5c8eC56b073bE27';
//     // collectors[ChainId.Polygon] = '0x802505465CB707c9347B9631818e14f6066f7513';
//     return collectors[chainId];
// };

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
                const oldProvider = networks[chainId];
                const newProvider = getProvider(chainId);
                const contract = getContract(chainId, contractName as ContractName);
                const currentOwner = toChecksumAddress(await contract.methods.owner().call());
                const newOwner = toChecksumAddress(newProvider.defaultAccount);
                // const registryAddress = toChecksumAddress(
                //     getContract(chainId, 'Registry', currentVersion).options.address,
                // );
                // const feeCollector = getFeeCollector(chainId);

                if (currentOwner !== newOwner) {
                    console.log('TransferOwnership:', contract.options.address, `${currentOwner} -> ${newOwner}`);
                    await send(
                        oldProvider.web3,
                        contract.options.address,
                        contract.methods.transferOwnership(newOwner),
                        currentOwner,
                    );
                }

                const tx = await updateDiamondContract(chainId, contract, diamondVariant);
                if (tx) console.log(`Upgraded: ${contractName} (${ChainId[chainId]}):`, currentVersion);

                // switch (diamondVariant) {
                //     case 'registry': {
                //         await TransactionService.send(
                //             contract.options.address,
                //             contract.methods.initialize(feeCollector, twoHalfPercent),
                //             chainId,
                //         );
                //         break;
                //     }
                //     case 'factory': {
                //         await TransactionService.send(
                //             contract.options.address,
                //             contract.methods.initialize(newOwner, registryAddress),
                //             chainId,
                //         );
                //         break;
                //     }
                // }
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
                const oldProvider = networks[pool.chainId];
                const newProvider = getProvider(pool.chainId);
                const currentOwner = toChecksumAddress(await pool.contract.methods.owner().call());
                const newOwner = toChecksumAddress(newProvider.defaultAccount);
                const currentRegistryAddress = toChecksumAddress(await pool.contract.methods.getRegistry().call());
                const registryAddress = toChecksumAddress(
                    getContract(pool.chainId, 'Registry', currentVersion).options.address,
                );

                if (currentOwner !== newOwner) {
                    const { methods } = new oldProvider.web3.eth.Contract(
                        getDiamondAbi(pool.chainId, 'defaultDiamond'),
                        pool.address,
                    );
                    console.log('TransferOwnership:', pool.address, `${currentOwner} -> ${newOwner}`);
                    await send(oldProvider.web3, pool.address, methods.transferOwnership(newOwner), currentOwner);
                }

                if (pool.version !== currentVersion) {
                    console.log('Upgrade:', pool.address, `${pool.variant} ${pool.version} -> ${currentVersion}`);
                    await AssetPoolService.updateAssetPool(pool, currentVersion);
                }

                if (registryAddress !== currentRegistryAddress) {
                    console.log('SetRegistry:', pool.address, `${currentRegistryAddress} -> ${registryAddress}`);
                    await TransactionService.send(
                        pool.address,
                        pool.contract.methods.setRegistry(registryAddress),
                        pool.chainId,
                    );
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
