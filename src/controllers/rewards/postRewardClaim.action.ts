import { Request, Response } from 'express';
import { BadRequestError, ForbiddenError } from '@/util/errors';
import { WithdrawalState, WithdrawalType } from '@/types/enums';
import { TWithdrawal } from '@/types/TWithdrawal';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';
import { WithdrawalDocument } from '@/models/Withdrawal';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_INCORRECT_SCOPE = 'No subscription is found for this type of access token.';
const ERROR_CAIM_NOT_ALLOWED = 'You are not allowed to claim this reward.';
const ERROR_NO_MEMBER = 'Could not claim this reward since you are not a member of the pool.';

export async function postRewardClaim(req: Request, res: Response) {
    if (!req.user.sub) throw new BadRequestError(ERROR_INCORRECT_SCOPE);

    const rewardId = Number(req.params.id);
    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError(ERROR_REWARD_NOT_FOUND);

    const account = await AccountProxy.getById(req.user.sub);
    if (!account.address) throw new BadRequestError(ERROR_ACCOUNT_NO_ADDRESS);

    const canClaim = await RewardService.canClaim(req.assetPool, reward, account);
    if (!canClaim) throw new ForbiddenError(ERROR_CAIM_NOT_ALLOWED);

    const isMember = await MemberService.isMember(req.assetPool, account.address);
    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError(ERROR_NO_MEMBER);

    const hasMembership = await MembershipService.hasMembership(req.assetPool, account.id);
    if (!hasMembership && !reward.isMembershipRequired) {
        await MembershipService.addMembership(account.id, req.assetPool);
    }

    let w: WithdrawalDocument = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ClaimReward,
        req.user.sub,
        reward.withdrawAmount,
        WithdrawalState.Pending,
        reward.id,
    );

    w = await WithdrawalService.proposeWithdraw(req.assetPool, w, account);

    const result: TWithdrawal = {
        id: String(w._id),
        sub: w.sub,
        poolAddress: req.assetPool.address,
        type: w.type,
        amount: w.amount,
        beneficiary: w.beneficiary,
        state: w.state,
        rewardId: w.rewardId,
        transactions: w.transactions,
        createdAt: w.createdAt,
    };

    return res.json(result);
}

/**
 * @swagger
 * /rewards/:id/claim:
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
