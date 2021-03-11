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
 *                 title
 *                    type: string
 *                    description: The title of the asset pool.
 *                 address
 *                    type: string
 *                    description: The address of the asset pool.
 *                 bypassPolls
 *                    type: boolean
 *                    description: Approve polls by default.
 *                 address
 *                    type: string
 *                    description: The address of the owner of the pool. Among other things the owner is responsible for paying all gas costs.
 *                 token:
 *                    type: object
 *                    properties:
 *                       name:
 *                          type: string
 *                          description: The name of the token configured for this asset pool.
 *                       symbol:
 *                          type: string
 *                          description: The symbol of the token configured for this asset pool.
 *                       balance:
 *                          type: number
 *                          description: The token balance of the asset pool for this token.
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

        const owner = await req.solution.getOwner();

        try {
            const tokenInstance = tokenContract(tokenAddress);
            const proposeWithdrawPollDuration = (await req.solution.getProposeWithdrawPollDuration()).toNumber();
            const rewardPollDuration = (await req.solution.getRewardPollDuration()).toNumber();
            const contractData = {
                owner,
                token: {
                    address: tokenInstance.address,
                    name: await tokenInstance.name(),
                    symbol: await tokenInstance.symbol(),
                    balance: Number(formatEther(await tokenInstance.balanceOf(req.params.address))),
                },
                proposeWithdrawPollDuration,
                rewardPollDuration,
            };
            const assetPool: AssetPoolDocument = await AssetPool.findOne({
                address: req.params.address,
            });

            if (!assetPool) {
                return next(new HttpError(404, 'Asset Pool is not found in database.'));
            }

            const { address, title, bypassPolls } = assetPool;

            res.json({ title, address, bypassPolls, ...contractData });
        } catch (error) {
            next(new HttpError(500, 'Asset Pool network data can not be obtained.', error));
        }
    } catch (error) {
        next(new HttpError(404, 'Asset Pool is not found on network.', error));
    }
};
