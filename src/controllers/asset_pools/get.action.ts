import { AssetPool, AssetPoolDocument } from '../../models/AssetPool';
import { Response, NextFunction } from 'express';
import { provider, tokenContract } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { formatEther } from 'ethers/lib/utils';

/**
 * @swagger
 * /asset_pools/:address:
 *   get:
 *     tags:
 *       - Asset Pools
 *     description: Provides information about the configuration and balance of an asset pool.
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
 *       '200':
 *          description: An asset pool object exposing the configuration and balance.
 *          schema:
 *             type: object
 *             properties:
 *                 title:
 *                    type: string
 *                    description: The title of the asset pool.
 *                 address:
 *                    type: string
 *                    description: The address of the asset pool.
 *                 bypassPolls:
 *                    type: boolean
 *                    description: Approve polls by default.
 *                 balance:
 *                    type: number
 *                    description: The token balance of the asset pool for this token.
 *                 token:
 *                    type: object
 *                    properties:
 *                       address:
 *                          type: string
 *                          description: The address of the asset pool.
 *                       name:
 *                          type: string
 *                          description: The name of the token configured for this asset pool.
 *                       symbol:
 *                          type: string
 *                          description: The symbol of the token configured for this asset pool.
 *                       totalSupply:
 *                          type: number
 *                          description: The total amount of tokens in circulation.
 *                       balance:
 *                          type: number
 *                          description: The token balance for this asset pool.
 *                 proposeWithdrawPollDuration:
 *                    type: number
 *                    description: The default duration of the withdraw polls.
 *                 rewardPollDuration:
 *                    type: number
 *                    description: The default duration of the reward polls.
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
export const getAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tokenAddress = await req.solution.getToken();
        const code = await provider.getCode(tokenAddress);

        if (code === '0x') {
            return next(new HttpError(404, `No data found at ERC20 address ${tokenAddress}`));
        }

        try {
            const tokenInstance = tokenContract(tokenAddress);
            const proposeWithdrawPollDuration = (await req.solution.getProposeWithdrawPollDuration()).toNumber();
            const rewardPollDuration = (await req.solution.getRewardPollDuration()).toNumber();
            const assetPool: AssetPoolDocument = await AssetPool.findOne({
                address: req.params.address,
            });

            if (!assetPool) {
                return next(new HttpError(404, 'Asset Pool is not found in database.'));
            }

            res.json({
                title: assetPool.title,
                address: assetPool.address,
                bypassPolls: assetPool.bypassPolls,
                token: {
                    address: tokenInstance.address,
                    name: await tokenInstance.name(),
                    symbol: await tokenInstance.symbol(),
                    totalSupply: Number(formatEther(await tokenInstance.totalSupply())),
                    balance: Number(formatEther(await tokenInstance.balanceOf(req.params.address))),
                },
                proposeWithdrawPollDuration,
                rewardPollDuration,
            });
        } catch (error) {
            return next(new HttpError(500, 'Asset Pool network data can not be obtained.', error));
        }
    } catch (error) {
        next(new HttpError(404, 'Asset Pool is not found on network.', error));
    }
};
