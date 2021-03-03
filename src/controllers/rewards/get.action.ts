import { Response, NextFunction } from 'express';
import { Reward, RewardDocument } from '../../models/Reward';
import { HttpError, HttpRequest } from '../../models/Error';
import { formatEther } from 'ethers/lib/utils';

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
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *               description: Unique identifier of the reward.
 *             title:
 *               type: string
 *               description:
 *             description:
 *               type: string
 *               description: The description
 *             withdrawAmount:
 *               type: number
 *               description: Current size of the reward
 *             withdrawDuration:
 *               type: number
 *               description: Current duration of the withdraw poll
 *             state:
 *               type: number
 *               description: Current state of the reward [Enabled, Disabled]
 *             poll:
 *               type: object
 *               properties:
 *                  address:
 *                      type: string
 *                      description: Address of the reward poll
 *                  withdrawAmount:
 *                      type: number
 *                      description: Proposed size of the reward
 *                  withdrawDuration:
 *                      type: number
 *                      description: Proposed duration of the withdraw poll
 *       '302':
 *          description: Redirect to `GET /rewards/:id`
 *          headers:
 *             Location:
 *                type: string
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
                    const { id, withdrawAmount, withdrawDuration, pollId, state } = await req.solution.getReward(i);
                    rewards.push({
                        id: id.toNumber(),
                        withdrawAmount: formatEther(withdrawAmount),
                        withdrawDuration: withdrawDuration.toNumber(),
                        pollId: pollId.toNumber(),
                        state,
                    });
                } catch (e) {
                    break;
                }
                i++;
            }
            res.json({ rewards });
        } catch (err) {
            next(new HttpError(404, 'Asset Pool get rewards failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Reward not found.', err));
    }
};
