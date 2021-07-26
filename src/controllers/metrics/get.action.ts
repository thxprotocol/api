import { Response, Request, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import { getAdmin, getProvider, NetworkProvider } from '@/util/network';
import { Account } from '@/models/Account';
import { Withdrawal } from '@/models/Withdrawal';
import { Reward } from '@/models/Reward';
import { AssetPool } from '@/models/AssetPool';
import { Client } from '@/models/Client';

async function getAvgRewardsPerPool(npid: number) {
    const rewardsPerPool = [];
    const assetPools = await AssetPool.find({ network: npid });

    for (const p of assetPools) {
        rewardsPerPool.push(await Reward.countDocuments({ poolAddress: p.address }));
    }

    const sum = rewardsPerPool.reduce((a: number, b: number) => a + b, 0);

    return sum / assetPools.length || 0;
}

async function getAvgWithdrawsPerPool(npid: number) {
    const withdrawalsPerPool = [];
    const assetPools = await AssetPool.find({ network: npid });

    for (const p of assetPools) {
        withdrawalsPerPool.push(await Withdrawal.countDocuments({ poolAddress: p.address }));
    }

    const sum = withdrawalsPerPool.reduce((a: number, b: number) => a + b, 0);

    return sum / assetPools.length || 0;
}

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const web3Main = getProvider(NetworkProvider.Main);
        const web3Test = getProvider(NetworkProvider.Test);
        const address = getAdmin(NetworkProvider.Main).address;
        const jsonData = {
            count_wallets: await Account.countDocuments(),
            count_applications: await Client.countDocuments({ 'payload.scope': 'openid admin' }),
            count_asset_pools: {
                mainnet: await AssetPool.countDocuments({ network: NetworkProvider.Main }),
                testnet: await AssetPool.countDocuments({ network: NetworkProvider.Test }),
            },
            count_transactions: {
                mainnet: await web3Main.eth.getTransactionCount(address),
                testnet: await web3Test.eth.getTransactionCount(address),
            },
            avg_rewards_per_pool: {
                mainnet: await getAvgRewardsPerPool(NetworkProvider.Main),
                testnet: await getAvgRewardsPerPool(NetworkProvider.Test),
            },
            avg_withdrawals_per_pool: {
                mainnet: await getAvgWithdrawsPerPool(NetworkProvider.Main),
                testnet: await getAvgWithdrawsPerPool(NetworkProvider.Test),
            },
        };

        res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
    } catch (error) {
        next(new HttpError(500, 'Could not get all API metrics.', error));
    }
};
