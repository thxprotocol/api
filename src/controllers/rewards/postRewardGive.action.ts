import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, ASSET_POOL, parseResultLog } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /rewards/:id/give:
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
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               withdrawPoll:
 *                  type: string
 *                  description: Address off the withdraw poll
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
export const postRewardGive = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const tx = await assetPoolInstance.giveReward(req.body.member).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e && e.name === 'WithdrawPollCreated')[0];
            const withdrawPoll = event.args.poll;

            res.json({ withdrawPoll });
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
