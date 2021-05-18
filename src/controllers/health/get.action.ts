import { ethers } from 'ethers';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import {
    ASSET_POOL_FACTORY_ADDRESS,
    POOL_REGISTRY_ADDRESS,
    RPC_WSS,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    TESTNET_POOL_REGISTRY_ADDRESS,
    TESTNET_RPC_WSS,
} from '../../util/secrets';
import { VERSION } from '../../util/secrets';
import { name, version, license } from '../../../package.json';
import { getAdmin, getProvider, NetworkProvider } from '../../util/network';
import { Account } from '../../models/Account';
import { Withdrawal } from '../../models/Withdrawal';
import { Reward } from '../../models/Reward';
import { AssetPool } from '../../models/AssetPool';
import Web3 from 'web3';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const provider = getProvider(npid);
    const address = await getAdmin(npid).getAddress();
    const balance = await provider.getBalance(address);

    return {
        admin: {
            address,
            balance: ethers.utils.formatEther(balance),
        },
        factory: {
            address: constants.factory,
            deployed: (await provider.getCode(constants.factory)) !== '0x',
        },
        registry: {
            address: constants.registry,
            deployed: (await provider.getCode(constants.registry)) !== '0x',
        },
    };
}

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const web3Main = new Web3(RPC_WSS);
        const web3Test = new Web3(TESTNET_RPC_WSS);
        const address = await getAdmin(NetworkProvider.Main).getAddress();
        const txMainnetCount = await web3Main.eth.getTransactionCount(address);
        const txTestnetCount = await web3Test.eth.getTransactionCount(address);

        const jsonData = {
            name: `${name} (${VERSION})`,
            version: version,
            license: license,
            metrics: {
                accounts: await Account.countDocuments(),
                assetpools: {
                    mainnet: await AssetPool.countDocuments({ network: NetworkProvider.Main }),
                    testnet: await AssetPool.countDocuments({ network: NetworkProvider.Test }),
                },
                rewards: {
                    mainnet: await Reward.countDocuments({ network: NetworkProvider.Main }),
                    testnet: await Reward.countDocuments({ network: NetworkProvider.Test }),
                },
                withdrawals: {
                    mainnet: await Withdrawal.countDocuments({ network: NetworkProvider.Main }),
                    testnet: await Withdrawal.countDocuments({ network: NetworkProvider.Test }),
                },
                transactions: {
                    mainnet: txMainnetCount,
                    testnet: txTestnetCount,
                },
            },
            testnet: await getNetworkDetails(NetworkProvider.Test, {
                factory: TESTNET_ASSET_POOL_FACTORY_ADDRESS,
                registry: TESTNET_POOL_REGISTRY_ADDRESS,
            }),
            mainnet: await getNetworkDetails(NetworkProvider.Main, {
                factory: ASSET_POOL_FACTORY_ADDRESS,
                registry: POOL_REGISTRY_ADDRESS,
            }),
        };

        res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
    } catch (error) {
        next(new HttpError(502, 'Could not verify health of the API.', error));
    }
};
