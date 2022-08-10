import db from '@/util/database';
import Web3 from 'web3';
import { HARDHAT_RPC, MONGODB_URI, POLYGON_MUMBAI_RPC, POLYGON_RPC, PRIVATE_KEY } from '@/config/secrets';
import { AssetPool } from '@/models/AssetPool';
import { ADMIN_ROLE } from '@/services/AssetPoolService';
import { getDiamondAbi } from '@/config/contracts';
import { getProvider } from '@/util/network';
import { AccountPlanType, ChainId } from '@/types/enums';
import AccountProxy from '@/proxies/AccountProxy';
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
    logger.debug('Start!', startTime);

    // Iterate over available chains
    for (const chainId of [ChainId.Hardhat]) {
        // create provider for chain with PRIVATE_KEY
        const oldProvider = networks[chainId];
        // get new provider for chain with getProvider()
        const newProvider = getProvider(chainId);
        const currentOwner = oldProvider.admin.address;
        const newOwner = newProvider.defaultAccount;

        for (const pool of await AssetPool.find()) {
            try {
                const account = await AccountProxy.getById(pool.sub);
                if (!account) return;

                const isFreeMumbai = account.plan === AccountPlanType.Free && pool.chainId === ChainId.PolygonMumbai;
                const isPaidPlan = [AccountPlanType.Basic, AccountPlanType.Premium].includes(account.plan);

                if (isPaidPlan || isFreeMumbai) {
                    const { methods } = new oldProvider.web3.eth.Contract(
                        getDiamondAbi(pool.chainId, pool.variant || 'defaultPool'),
                        pool.address,
                    );

                    // Add ownership for new owner address for applicable pools with provider
                    if (!(await methods.isMember(newOwner).call())) {
                        logger.debug('Adding new owner to members');
                        await send(oldProvider.web3, pool.address, methods.addMember(newOwner));
                    }
                    if (!(await methods.isManager(newOwner).call())) {
                        logger.debug('Adding new owner to managers');
                        await send(oldProvider.web3, pool.address, methods.addManager(newOwner));
                    }
                    if (!(await methods.hasRole(ADMIN_ROLE, newOwner).call())) {
                        logger.debug('Granting new owner admin role');
                        await send(oldProvider.web3, pool.address, methods.grantRole(ADMIN_ROLE, newOwner));
                    }

                    if (toChecksumAddress(await methods.owner().call()) !== newOwner) {
                        await send(oldProvider.web3, pool.address, methods.transferOwnership(newOwner));
                        logger.debug('TransferOwnership:', pool.address);
                    }

                    // Remove ownership, member and manager roles for old owner if new owner has all roles
                    // if (
                    //     (await methods.hasRole(ADMIN_ROLE, currentOwner).call()) &&
                    //     (await methods.hasRole(ADMIN_ROLE, newOwner).call())
                    // ) {
                    //     const { methods } = new newProvider.web3.eth.Contract(
                    //         getDiamondAbi(pool.chainId, pool.variant || 'defaultPool'),
                    //         pool.address,
                    //     );

                    //     if (await methods.hasRole(ADMIN_ROLE, currentOwner).call()) {
                    //         logger.debug('Remove former owners admin role');
                    //         await methods.revokeRole(ADMIN_ROLE, currentOwner).send();
                    //     }
                    //     if (await methods.isManager(currentOwner).call()) {
                    //         logger.debug('Removing former owner from managers');
                    //         await methods.removeManager(currentOwner).send();
                    //     }
                    //     if (await methods.isMember(currentOwner).call()) {
                    //         logger.debug('Remove former owner from members');
                    //         await methods.removeMember(currentOwner).send();
                    //     }
                    // }
                }
            } catch (error) {
                logger.debug(error);
            }
        }
    }

    const endTime = Date.now();
    logger.debug('Done!', startTime, endTime, endTime - startTime);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
