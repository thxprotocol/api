import { Response, NextFunction } from 'express';
import { RewardDocument } from '../../models/Reward';
import { HttpError, HttpRequest } from '../../models/Error';
import { formatEther } from 'ethers/lib/utils';
import { Contract } from '@ethersproject/contracts';

export async function getRewardData(solution: Contract, rewardID: number) {
    try {
        const { id, withdrawAmount, withdrawDuration, pollId, state } = await solution.getReward(rewardID);
        const pid = pollId.toNumber();
        const reward = {
            id: id.toNumber(),
            withdrawAmount: Number(formatEther(withdrawAmount)),
            withdrawDuration: withdrawDuration.toNumber(),
            state,
        } as RewardDocument;

        if (pid) {
            reward.poll = {
                id: pid,
                withdrawAmount: Number(formatEther(await solution.getWithdrawAmount(pollId))),
                withdrawDuration: (await solution.getWithdrawDuration(pollId)).toNumber(),
                startTime: (await solution.getStartTime(pollId)).toNumber(),
                endTime: (await solution.getEndTime(pollId)).toNumber(),
                yesCounter: (await solution.getYesCounter(pollId)).toNumber(),
                noCounter: (await solution.getNoCounter(pollId)).toNumber(),
                totalVoted: (await solution.getTotalVoted(pollId)).toNumber(),
            };
        }
        return reward;
    } catch (e) {
        return;
    }
}

/**
 * @swagger
 * /rewards/:id:
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
 *             withdrawAmount:
 *               type: number
 *               description: Current size of the reward
 *             withdrawDuration:
 *               type: number
 *               description: Current duration of the withdraw poll
 *             state:
 *               type: number
 *               description: Current state of the reward [Disabled, Enabled]
 *             poll:
 *               type: object
 *               properties:
 *                  id:
 *                      type: number
 *                      description: Unique identifier of the reward poll
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
        const reward = await getRewardData(req.solution, Number(req.params.id));

        if (!reward) {
            return next(new HttpError(404, 'Asset Pool reward not found.'));
        }

        res.json(reward);
    } catch (err) {
        next(new HttpError(402, 'Asset Pool get reward failed.', err));
        return;
    }
};
