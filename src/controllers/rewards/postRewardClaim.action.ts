import { Request, Response, NextFunction } from 'express';
import { ASSET_POOL, gasStation, parseResultLog } from '../../util/network';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

/**
 * @swagger
 * /rewards/:id/claim:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a quick response image to claim the reward.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /members/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postRewardClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
