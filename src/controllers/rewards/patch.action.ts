import RewardService from '@/services/RewardService';
import AssetPoolService from '@/services/AssetPoolService';
import { Request, Response } from 'express';

export async function patchReward(req: Request, res: Response) {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
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
    await RewardService.update(req.assetPool, reward.id, { withdrawAmount, withdrawDuration });

    if (await AssetPoolService.canBypassRewardPoll(req.assetPool)) {
        await RewardService.finalizePoll(req.assetPool, reward);
    }

    res.status(200).json(reward);
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
