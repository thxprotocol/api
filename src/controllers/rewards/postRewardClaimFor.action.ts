import { Request, Response, NextFunction } from 'express';
import { solutionContract, ASSET_POOL, parseLogs, parseResultLog } from '../../util/network';
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
export const postRewardClaimFor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = solutionContract(req.header('AssetPool'));
        const result = await assetPoolInstance.rewards(req.params.id);

        if (!result) {
            throw new Error(result);
        }

        try {
            const tx = await (await assetPoolInstance.claimRewardFor(req.params.id, req.body.member)).wait();

            try {
                const logs = await parseLogs(ASSET_POOL.abi, tx.logs);
                const event = logs.filter((e: { name: string }) => e && e.name === 'WithdrawPollCreated')[0];
                const withdrawPoll = event.args.poll;

                res.json({ withdrawPoll });
            } catch (err) {
                next(new HttpError(500, 'Parse logs failed.', err));
                return;
            }
        } catch (err) {
            next(new HttpError(502, 'Asset Pool claimRewardFor failed.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool reward does not exist.', err));
    }
};
