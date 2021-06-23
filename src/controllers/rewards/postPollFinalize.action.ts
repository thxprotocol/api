import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';
import { getRewardData } from './getReward.action';
import { callFunction, sendTransaction } from '../../util/network';

/**
 * @swagger
 * /rewards/:id/poll/finalize:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Finalizes the reward poll.
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
 *         type: number
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
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
export const postPollFinalize = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { pollId } = await callFunction(req.solution.methods.getReward(req.params.id), req.assetPool.network);

        await sendTransaction(req.solution.methods.rewardPollFinalize(pollId), req.assetPool.network);

        try {
            const reward = await getRewardData(req.solution, Number(req.params.id), req.assetPool.network);

            if (!reward) {
                return next(new HttpError(404, 'No reward found for this ID.'));
            }

            res.json(reward);
        } catch (e) {
            return next(new HttpError(502, 'Could not get reward data from the network.', e));
        }
    } catch (e) {
        next(new HttpError(502, 'Could not finalize the reward poll.', e));
    }
};
