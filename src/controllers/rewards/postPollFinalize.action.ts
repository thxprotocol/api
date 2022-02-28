import RewardService from '@/services/RewardService';
import { Request, Response } from 'express';
import { NotFoundError } from '@/util/errors';
import { TReward } from '@/models/Reward';

export const postPollFinalize = async (req: Request, res: Response) => {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError();

    const r = await RewardService.finalizePoll(req.assetPool, reward);
    const poll = r.pollId > 0 ? { poll: await RewardService.getRewardPoll(req.assetPool, r.pollId) } : {};

    const result: TReward = {
        id: Number(r.id),
        poolAddress: req.assetPool.address,
        withdrawAmount: r.withdrawAmount,
        withdrawDuration: Number(r.withdrawDuration),
        withdrawCondition: r.withdrawCondition,
        isClaimOnce: r.isClaimOnce,
        isMembershipRequired: r.isMembershipRequired,
        state: r.state,
        pollId: Number(r.pollId),
        ...poll,
    };

    res.json(result);
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
