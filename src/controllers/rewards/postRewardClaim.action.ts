import { Request, Response } from 'express';
import { agenda, eventNameProcessWithdrawals } from '@/util/agenda';

import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import { WithdrawalState, WithdrawalType } from '@/enums';
import { BadRequestError, ForbiddenError } from '@/util/errors';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_INCORRECT_SCOPE = 'No subscription is found for this type of access token.';
const ERROR_CAIM_NOT_ALLOWED = 'You are not allowed to claim this reward.';
const ERROR_NO_MEMBER = 'Could not claim this reward since you are not a member of the pool.';

export async function postRewardClaim(req: Request, res: Response) {
    const rewardId = Number(req.params.id);

    const sub = req.user.sub;
    if (!sub) throw new BadRequestError(ERROR_INCORRECT_SCOPE);

    const reward = await RewardService.get(req.assetPool, rewardId);
    if (!reward) throw new BadRequestError(ERROR_REWARD_NOT_FOUND);

    const account = await AccountProxy.getById(sub);
    if (!account.address) throw new BadRequestError(ERROR_ACCOUNT_NO_ADDRESS);

    // Check if the claim conditions are currently valid, recheck in job
    const canClaim = await RewardService.canClaim(req.assetPool, reward, account);
    if (!canClaim) throw new ForbiddenError(ERROR_CAIM_NOT_ALLOWED);
    // Check for membership separate since we might need to add a membership in the job
    const isMember = await MemberService.isMember(req.assetPool, account.address);
    if (!isMember && reward.isMembershipRequired) throw new ForbiddenError(ERROR_NO_MEMBER);

    const { _id, amount, beneficiary, state, createdAt } = await WithdrawalService.schedule(
        req.assetPool,
        WithdrawalType.ClaimReward,
        account.address,
        reward.withdrawAmount,
        WithdrawalState.Pending,
        reward.id,
    );

    agenda.now(eventNameProcessWithdrawals, null);

    return res.json({ id: String(_id), amount, beneficiary, state, rewardId, createdAt });
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
