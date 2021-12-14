import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { getAdmin, getProvider, NetworkProvider } from '../../util/network';
// import AccountProxy from '../../proxies/AccountProxy';
import AssetPoolService from '../../services/AssetPoolService';
import RewardService from '../../services/RewardService';
import WithdrawalService from '../../services/WithdrawalService';
import ClientService from '../../services/ClientService';

async function getAvgRewardsPerPool(npid: number) {
    const rewardsPerPool = [];
    const { assetPools, error } = await AssetPoolService.findByNetwork(npid);
    if (error) throw new Error(error);
    for (const p of assetPools) {
        const count = await RewardService.countByPoolAddress(p.address);
        rewardsPerPool.push(count);
    }

    const sum = Number(rewardsPerPool.reduce((a: number, b: number) => a + b, 0));

    return sum / assetPools.length || 0;
}

async function getAvgWithdrawsPerPool(npid: number) {
    const withdrawalsPerPool = [];
    const { assetPools } = await AssetPoolService.findByNetwork(npid);

    for (const p of assetPools) {
        const count = await WithdrawalService.countByPoolAddress(p.address);
        withdrawalsPerPool.push(count);
    }

    const sum = Number(withdrawalsPerPool.reduce((a: number, b: number) => a + b, 0));

    return sum / assetPools.length || 0;
}

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const web3Main = getProvider(NetworkProvider.Main);
        const web3Test = getProvider(NetworkProvider.Test);
        const address = getAdmin(NetworkProvider.Main).address;

        const jsonData = {
            // count_wallets: await AccountService.count(),
            count_applications: await ClientService.countScope('openid admin'),
            count_asset_pools: {
                mainnet: await AssetPoolService.countByNetwork(NetworkProvider.Main),
                testnet: await AssetPoolService.countByNetwork(NetworkProvider.Test),
            },
            count_transactions: {
                mainnet:
                    (await web3Main.eth.getTransactionCount(address)) +
                    (await web3Main.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for realistic total
                testnet:
                    (await web3Test.eth.getTransactionCount(address)) +
                    (await web3Test.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for realistic total
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

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags:
 *       - Metrics
 *     description: Gets metrics.
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 count_wallets:
 *                   type: number
 *                 count_applications:
 *                   type: number
 *                 count_asset_pools:
 *                   type: object
 *                   properties:
 *                     mainnet:
 *                       type: number
 *                     testnet:
 *                       type: number
 *                 count_transactions:
 *                   type: object
 *                   properties:
 *                     mainnet:
 *                       type: number
 *                     testnet:
 *                       type: number
 *                 avg_rewards_per_pool:
 *                   type: object
 *                   properties:
 *                     mainnet:
 *                       type: number
 *                     testnet:
 *                       type: number
 *                 avg_withdrawals_per_pool:
 *                   type: object
 *                   properties:
 *                     mainnet:
 *                       type: number
 *                     testnet:
 *                       type: number
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to get this information.
 *       '404':
 *         description: Not Found. Details not found.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
