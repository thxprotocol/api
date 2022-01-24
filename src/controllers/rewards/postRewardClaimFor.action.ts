import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

import RewardService from '../../services/RewardService';
import JobService from '../../services/JobService';
import WithdrawalService from '../../services/WithdrawalService';
import MemberService, { ERROR_IS_NOT_MEMBER } from '../../services/MemberService';

import '../../jobs/claimRewardFor';

const ERROR_NO_REWARD = 'Could not find a reward for this id';

export const postRewardClaimFor = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const rewardId = Number(req.params.id);
        const { reward } = await RewardService.get(req.assetPool, rewardId);

        if (!reward) return next(new HttpError(400, ERROR_NO_REWARD));

        const { isMember } = await MemberService.isMember(req.assetPool, req.body.member);

        if (!isMember && reward.isMembershipRequired) return next(new HttpError(403, ERROR_IS_NOT_MEMBER));

        const withdrawal = await WithdrawalService.schedule(
            req.assetPool,
            req.body.member,
            reward.withdrawAmount,
            rewardId,
        );
        const job = await JobService.claimRewardFor(
            req.assetPool,
            withdrawal._id.toString(),
            rewardId,
            req.body.member,
        );

        withdrawal.jobId = job.attrs._id.toString();
        await withdrawal.save();

        return res.json(withdrawal);
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
