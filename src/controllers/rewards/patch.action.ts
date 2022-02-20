import RewardService from '@/services/RewardService';
import AssetPoolService from '@/services/AssetPoolService';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import { RewardDocument, IRewardUpdates } from '@/models/Reward';

export async function patchReward(req: Request, res: Response, next: NextFunction) {
    async function getReward(rewardId: number): Promise<RewardDocument> {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);
        if (!reward) {
            next(new HttpError(404, 'No reward found for this ID.'));
        }
        if (error) {
            throw new Error(error.message);
        }
        return reward;
    }

    async function updateReward(rewardId: number, updates: IRewardUpdates) {
        const { pollId, error } = await RewardService.update(req.assetPool, rewardId, updates);

        if (error) {
            throw new Error(error.message);
        }

        return pollId;
    }

    async function finalizeRewardPoll(reward: RewardDocument) {
        const { finalizedReward, error } = await RewardService.finalizePoll(req.assetPool, reward);
        if (error) {
            throw new Error(error.message);
        }
        return finalizedReward;
    }

    try {
        let reward = await getReward(Number(req.params.id));
        let withdrawAmount = reward.withdrawAmount;
        let withdrawDuration = reward.withdrawDuration;
        const shouldUpdateWithdrawAmount = req.body.withdrawAmount && reward.withdrawAmount !== req.body.withdrawAmount;
        const shouldUpdateWithdrawDuration =
            req.body.withdrawDuration && reward.withdrawDuration !== req.body.withdrawDuration;

        if (!shouldUpdateWithdrawAmount && !shouldUpdateWithdrawDuration) {
            return res.json(reward);
        }

        if (shouldUpdateWithdrawAmount) {
            withdrawAmount = req.body.withdrawAmount;
        }

        if (shouldUpdateWithdrawDuration) {
            withdrawDuration = Number(req.body.withdrawDuration);
        }

        await updateReward(reward.id, { withdrawAmount, withdrawDuration });

        const canBypassPoll = await AssetPoolService.canBypassRewardPoll(req.assetPool);

        if (canBypassPoll) {
            reward = await finalizeRewardPoll(reward);
        }

        res.status(200).json(reward);
    } catch (error) {
        next(new HttpError(502, 'Could not get reward information from the pool.', error));
    }
}

/**
 * @swagger
 * /rewards/:id:
 *   patch:
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
 *       - name: withdrawAmount
 *         in: body
 *         required: true
 *         type: integer
 *       - name: withdrawDuration
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: Base64 string representing function call
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
