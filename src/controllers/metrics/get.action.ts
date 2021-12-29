import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { getAdmin, getProvider, NetworkProvider } from '../../util/network';
// import AccountService from '../../services/AccountService';
import AssetPoolService from '../../services/AssetPoolService';
import WithdrawalService from '../../services/WithdrawalService';

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const web3Main = getProvider(NetworkProvider.Main);
        const web3Test = getProvider(NetworkProvider.Test);
        const address = getAdmin(NetworkProvider.Main).address;

        const jsonData = {
            count_asset_pools: {
                mainnet: await AssetPoolService.countByNetwork(NetworkProvider.Main),
                testnet: await AssetPoolService.countByNetwork(NetworkProvider.Test),
            },
            count_withdrawals: {
                mainnet: await WithdrawalService.countByNetwork(NetworkProvider.Main),
                testnet: await WithdrawalService.countByNetwork(NetworkProvider.Test),
            },
            count_transactions: {
                mainnet:
                    (await web3Main.eth.getTransactionCount(address)) +
                    (await web3Main.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for realistic total
                testnet:
                    (await web3Test.eth.getTransactionCount(address)) +
                    (await web3Test.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for realistic total
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