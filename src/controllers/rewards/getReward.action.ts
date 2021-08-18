import { Response, NextFunction } from 'express';
import { Reward, RewardDocument } from '../../models/Reward';
import { HttpError, HttpRequest } from '../../models/Error';
import { formatEther } from 'ethers/lib/utils';
import { Contract } from 'web3-eth-contract';
import { callFunction, NetworkProvider } from '../../util/network';

export async function getRewardData(solution: Contract, rewardID: number, npid: NetworkProvider) {
    try {
        const reward = await Reward.findOne({ poolAddress: solution.options.address, id: rewardID });
        const beneficiaries = reward && reward.beneficiaries ? reward.beneficiaries : [];

        try {
            const { id, withdrawAmount, withdrawDuration, pollId, state } = await callFunction(
                solution.methods.getReward(rewardID),
                npid,
            );
            const reward = {
                id: Number(id),
                withdrawAmount: Number(formatEther(withdrawAmount)),
                withdrawDuration: Number(withdrawDuration),
                beneficiaries,
                state: Number(state),
            } as RewardDocument;

            if (Number(pollId) > 0) {
                reward.poll = {
                    id: Number(pollId),
                    withdrawAmount: Number(
                        formatEther(await callFunction(solution.methods.getWithdrawAmount(pollId), npid)),
                    ),
                    withdrawDuration: Number(await callFunction(solution.methods.getWithdrawDuration(pollId), npid)),
                    startTime: Number(await callFunction(solution.methods.getStartTime(pollId), npid)),
                    endTime: Number(await callFunction(solution.methods.getEndTime(pollId), npid)),
                    yesCounter: Number(await callFunction(solution.methods.getYesCounter(pollId), npid)),
                    noCounter: Number(await callFunction(solution.methods.getNoCounter(pollId), npid)),
                    totalVoted: Number(await callFunction(solution.methods.getTotalVoted(pollId), npid)),
                };
            }
            return reward;
        } catch (e) {
            return;
        }
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
        const reward = await getRewardData(req.solution, Number(req.params.id), req.assetPool.network);

        if (!reward) {
            return next(new HttpError(404, 'Asset Pool reward not found.'));
        }

        res.json(reward);
    } catch (err) {
        next(new HttpError(402, 'Asset Pool get reward failed.', err));
    }
};
