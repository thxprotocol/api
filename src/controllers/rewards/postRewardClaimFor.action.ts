import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import RewardService from '../../services/RewardService';

const ERROR_NO_REWARD = 'Could not find a reward for this id';

export const postRewardClaimFor = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getReward(rewardId: number) {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);
        if (error) return next(new HttpError(500, error.message, error));
        return reward;
    }

    async function claimRewardFor(rewardId: number, address: string) {
        const { withdrawal, error } = await RewardService.claimRewardFor(req.assetPool, rewardId, address);
        if (error) throw new Error(error.message);
        return withdrawal;
    }

    try {
        const rewardId = Number(req.params.id);
        const reward = await getReward(rewardId);

        if (!reward) return next(new HttpError(400, ERROR_NO_REWARD));

        const withdrawal = await claimRewardFor(reward.id, req.body.member);

        return res.json({ withdrawal });
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
};

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
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 withdrawPoll:
 *                   type: string
 *                   description: Address off the withdraw poll
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
