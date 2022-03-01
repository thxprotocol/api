import { Request, Response } from 'express';
import { agenda, eventNameProcessWithdrawals } from '@/util/agenda';

import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import AccountProxy from '@/proxies/AccountProxy';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { BadRequestError, ForbiddenError } from '@/util/errors';

const ERROR_NO_REWARD = 'Could not find a reward for this id';

export const postRewardClaimFor = async (req: Request, res: Response) => {
    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);

    if (!reward) throw new BadRequestError(ERROR_NO_REWARD);

    const isMember = await MemberService.isMember(req.assetPool, req.body.member);

    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError();

    const account = await AccountProxy.getByAddress(req.body.member);
    const withdrawal = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ClaimRewardFor,
        req.body.member,
        reward.withdrawAmount,
        // Accounts with stored (encrypted) privateKeys are custodial and should not be processed before
        // they have logged into their wallet to update their account with a new wallet address.
        account.privateKey ? WithdrawalState.Deferred : WithdrawalState.Pending,
        rewardId,
    );

    agenda.now(eventNameProcessWithdrawals, null);

    return res.json({
        id: String(withdrawal._id),
        type: withdrawal.type,
        withdrawalId: withdrawal.withdrawalId,
        beneficiary: withdrawal.beneficiary,
        amount: withdrawal.amount,
        approved: withdrawal.approved,
        state: withdrawal.state,
        poll: withdrawal.poll,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
    });
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
