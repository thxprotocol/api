import { Request, Response } from 'express';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/TWithdrawal';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import { WithdrawalDocument } from '@/models/Withdrawal';

const ERROR_NO_REWARD = 'Could not find a reward for this id';

export const postRewardClaimFor = async (req: Request, res: Response) => {
    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError(ERROR_NO_REWARD);

    const isMember = await MemberService.isMember(req.assetPool, req.body.member);
    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError();

    const account = await AccountProxy.getByAddress(req.body.member);
    if (!account) throw new NotFoundError();

    let w: WithdrawalDocument = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ClaimRewardFor,
        account.id,
        reward.withdrawAmount,
        // Accounts with stored (encrypted) privateKeys are custodial and should not be processed before
        // they have logged into their wallet to update their account with a new wallet address.
        account.privateKey ? WithdrawalState.Deferred : WithdrawalState.Pending,
        rewardId,
    );

    w = await WithdrawalService.proposeWithdraw(req.assetPool, w, account);

    const result: TWithdrawal = {
        id: String(w._id),
        sub: account.id,
        poolAddress: req.assetPool.address,
        type: w.type,
        withdrawalId: w.withdrawalId,
        beneficiary: w.beneficiary,
        amount: w.amount,
        state: w.state,
        transactions: w.transactions,
        createdAt: w.createdAt,
    };

    return res.json(result);
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
