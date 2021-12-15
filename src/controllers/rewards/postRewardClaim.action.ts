import AccountProxy from '../../proxies/AccountProxy';
import MembershipService from '../../services/MembershipService';
import AssetPoolService from '../../services/AssetPoolService';
import RewardService from '../../services/RewardService';
import MemberService from '../../services/MemberService';
import WithdrawalService from '../../services/WithdrawalService';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { RewardDocument } from '../../models/Reward';
import { WithdrawalDocument } from '../../models/Withdrawal';
import { IAccount } from '../../models/Account';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_INCORRECT_SCOPE = 'No subscription is found for this type of access token.';
const ERROR_CLAIM_ONCE_FAILED = 'ClaimRewardForOnce failed';
const ERROR_WITHDRAWAL_NOT_FOUND = 'No withdrawal found failed.';
const ERROR_CAIM_NOT_ALLOWED = 'Could not claim this reward due to the claim conditions.';
const ERROR_NO_MEMBER = 'Could not claim this reward since you are not a member of the pool.';

export const postRewardClaim = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getReward(rewardId: number) {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);
        if (error) throw new Error(error.message);
        return reward;
    }

    async function getAccount(sub: string) {
        const { account, error } = await AccountProxy.getById(sub);
        if (error) throw new Error(error.message);
        if (!account.address) throw new Error(ERROR_ACCOUNT_NO_ADDRESS);
        return account;
    }

    async function checkIsMember(address: string) {
        const { isMember, error } = await MemberService.isMember(req.assetPool, address);
        if (error) throw new Error(error.message);
        return isMember;
    }

    async function addMember(address: string) {
        const { error } = await MemberService.addMember(req.assetPool, address);
        if (error) throw new Error(error.message);
    }

    async function addMembership(sub: string) {
        const { error } = await MembershipService.addMembership(sub, req.assetPool);
        if (error) throw new Error(error.message);
    }

    async function checkCanClaim(reward: RewardDocument, account: IAccount) {
        const { canClaim, error } = await RewardService.canClaim(req.assetPool, reward, account);
        if (error) throw new Error(error.message);
        return canClaim;
    }

    async function claimRewardOnce(rewardId: number, address: string) {
        const { withdrawal, error } = await RewardService.claimRewardForOnce(req.assetPool, rewardId, address);
        if (error) throw new Error(ERROR_CLAIM_ONCE_FAILED);
        if (!withdrawal) throw new Error(ERROR_WITHDRAWAL_NOT_FOUND);
        return withdrawal;
    }

    async function canBypassWithdrawPoll(account: IAccount, reward: RewardDocument) {
        const { canBypassPoll, error } = await AssetPoolService.canBypassWithdrawPoll(req.assetPool, account, reward);
        if (error) throw new Error(error.message);
        return canBypassPoll;
    }

    async function finalizeWithdrawPoll(withdrawal: WithdrawalDocument) {
        const { finalizedWithdrawal, error } = await WithdrawalService.withdrawPollFinalize(
            req.assetPool,
            withdrawal.id,
        );
        if (error) throw new Error(error.message);
        return finalizedWithdrawal;
    }

    try {
        const rewardId = Number(req.params.id);
        const sub = req.user.sub;

        if (!sub) return next(new HttpError(500, ERROR_INCORRECT_SCOPE));

        const reward = await getReward(rewardId);

        if (!reward) return next(new HttpError(500, ERROR_REWARD_NOT_FOUND));

        const account = await getAccount(sub);
        const isMember = await checkIsMember(account.address);

        if (reward.isMembershipRequired && !isMember) {
            return next(new HttpError(403, ERROR_NO_MEMBER));
        }

        if (!reward.isMembershipRequired && !isMember) {
            await addMember(account.address);
            await addMembership(account.id);
        }

        const canClaim = await checkCanClaim(reward, account);

        if (!canClaim) {
            return next(new HttpError(403, ERROR_CAIM_NOT_ALLOWED));
        }

        let withdrawal = await claimRewardOnce(rewardId, account.address);

        const canByPass = await canBypassWithdrawPoll(account, reward);

        if (withdrawal && canByPass) {
            const finalizedWithdrawal = await finalizeWithdrawPoll(withdrawal);

            if (finalizedWithdrawal) {
                withdrawal = finalizedWithdrawal;
            }
        }

        return res.json(withdrawal);
    } catch (error) {
        return next(new HttpError(500, error.message, error));
    }
};

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
