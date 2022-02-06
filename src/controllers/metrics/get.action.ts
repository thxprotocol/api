import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { getProvider, NetworkProvider } from '../../util/network';
import AssetPoolService from '../../services/AssetPoolService';
import WithdrawalService from '../../services/WithdrawalService';
import MembershipService from '../../services/MembershipService';

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const providerTest = getProvider(NetworkProvider.Main);
        const providerMain = getProvider(NetworkProvider.Test);

        const metrics = {
            count_asset_pools: {
                mainnet: await AssetPoolService.countByNetwork(NetworkProvider.Main),
                testnet: await AssetPoolService.countByNetwork(NetworkProvider.Test),
            },
            count_memberships: {
                mainnet: await MembershipService.countByNetwork(NetworkProvider.Main),
                testnet: await MembershipService.countByNetwork(NetworkProvider.Test),
            },
            count_withdrawals: {
                mainnet: await WithdrawalService.countByNetwork(NetworkProvider.Main),
                testnet: await WithdrawalService.countByNetwork(NetworkProvider.Test),
            },
            count_transactions: {
                mainnet:
                    (await providerMain.web3.eth.getTransactionCount(providerMain.admin.address)) +
                    (await providerMain.web3.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for accurate total
                testnet:
                    (await providerTest.web3.eth.getTransactionCount(providerTest.admin.address)) +
                    (await providerTest.web3.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for accurate total
            },
        };

        res.json(metrics);
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
