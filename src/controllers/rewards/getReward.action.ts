import { Response, NextFunction } from 'express';
import { Reward, RewardDocument } from '../../models/Reward';
import { HttpError, HttpRequest } from '../../models/Error';

/**
 * @swagger
 * /rewards/:id/:
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
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
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
export const getReward = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        try {
            const { id, withdrawAmount, withdrawDuration, pollId, state } = await req.solution.getReward(req.params.id);
            const reward = {
                id: id.toNumber(),
                withdrawAmount: withdrawAmount,
                withdrawDuration: withdrawDuration.toNumber(),
                state,
                pollId: pollId.toNumber(),
                poll:
                    pollId !== '0'
                        ? {
                              pollId: pollId.toNumber(),
                              withdrawAmount: await req.solution.getWithdrawAmount(pollId),
                              withdrawDuration: (await req.solution.getWithdrawDuration(pollId)).toNumber(),
                          }
                        : null,
            } as RewardDocument;

            res.json(reward);
        } catch (err) {
            next(new HttpError(404, 'Asset Pool get reward failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Reward not found.', err));
    }
};
