import { AssetPool, AssetPoolDocument } from '../../models/AssetPool';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /asset_pools/:address:
 *   get:
 *     tags:
 *       - Asset Pools
 *     description: Get information about a specific asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *          description: An asset pool object exposing the configuration and balance.
 *          schema:
 *              type: object
 *              properties:
 *                 token:
 *                    type: object
 *                    properties:
 *                       name:
 *                          type: string
 *                          description: The name of the token configured for this asset pool
 *                       symbol:
 *                          type: string
 *                          description: The symbol of the token configured for this asset pool
 *                       balance:
 *                          type: number
 *                          description: The token balance of the asset pool for this token
 *                 proposeWithdrawPollDuration:
 *                    type: number
 *                    description: The default duration of the withdraw polls
 *                 rewardPollDuration:
 *                    type: number
 *                    description: The default duration of the reward polls
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = assetPoolContract(req.params.address);
        const tokenAddress = await assetPoolInstance.token();

        try {
            const tokenInstance = tokenContract(tokenAddress);
            const proposeWithdrawPollDuration = (await assetPoolInstance.proposeWithdrawPollDuration()).toNumber();
            const rewardPollDuration = (await assetPoolInstance.rewardPollDuration()).toNumber();
            const contractData = {
                token: {
                    address: tokenInstance.address,
                    name: await tokenInstance.name(),
                    symbol: await tokenInstance.symbol(),
                    balance: await tokenInstance.balanceOf(req.params.address),
                },
                proposeWithdrawPollDuration,
                rewardPollDuration,
            };
            const { uid, address, title }: AssetPoolDocument = await AssetPool.findOne({
                address: req.params.address,
            });

            if (!address) {
                next(new HttpError(404, 'Asset Pool is not found in database.'));
            }

            res.json({ title, address, uid, ...contractData });
        } catch (error) {
            next(new HttpError(500, 'Asset Pool network data can not be obtained.', error));
        }
    } catch (error) {
        next(new HttpError(404, 'Asset Pool is not found on network.', error));
    }
};
