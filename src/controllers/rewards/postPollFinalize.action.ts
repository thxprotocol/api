import RewardService from '../../services/RewardService';
import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';
import { RewardDocument } from '../../models/Reward';

export const postPollFinalize = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getReward(rewardId: number) {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);
        if (error) {
            throw new Error(error.message);
        }
        return reward;
    }

    async function finalizeRewardPoll(reward: RewardDocument) {
        const { finalizedReward, error } = await RewardService.finalizePoll(req.assetPool, reward);
        if (error) {
            throw new Error(error.message);
        }
        return finalizedReward;
    }

    try {
        const rewardId = Number(req.params.id);
        const reward = await getReward(rewardId);
        if (!reward) return next(new HttpError(404, 'No reward found for this ID.'));
        const finalizedReward = await finalizeRewardPoll(reward);

        res.json(finalizedReward);
    } catch (e) {
        next(new HttpError(502, 'Could not finalize the reward poll.', e));
    }
};

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
