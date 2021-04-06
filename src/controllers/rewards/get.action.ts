import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { getRewardData } from './getReward.action';

/**
 * @swagger
 * /rewards:
 *   get:
 *     tags:
 *       - Rewards
 *     description: Get information about a reward in the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         schema:
 *           type: array
 *           items:
 *              type: object
 *              properties:
 *                id:
 *                  type: number
 *                  description: Unique identifier of the reward.
 *                withdrawAmount:
 *                  type: number
 *                  description: Current size of the reward
 *                withdrawDuration:
 *                  type: number
 *                  description: Current duration of the withdraw poll
 *                state:
 *                  type: number
 *                  description: Current state of the reward [Disabled, Enabled]
 *                poll:
 *                  type: object
 *                  properties:
 *                     id:
 *                         type: number
 *                         description: Unique identifier of the reward poll
 *                     withdrawAmount:
 *                         type: number
 *                         description: Proposed size of the reward
 *                     withdrawDuration:
 *                         type: number
 *                         description: Proposed duration of the withdraw poll
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Reward not found for this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getRewards = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        try {
            const rewards = [];
            let i = 1;
            while (i >= 1) {
                try {
                    const reward = await getRewardData(req.solution, i);
                    if (reward) {
                        rewards.push(reward);
                        i++;
                    } else {
                        break;
                    }
                } catch (e) {
                    break;
                }
            }
            res.json(rewards);
        } catch (err) {
            next(new HttpError(404, 'Asset Pool get rewards failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Reward not found.', err));
    }
};
