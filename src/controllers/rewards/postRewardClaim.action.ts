import AssetPoolService from '../../services/AssetPoolService';
import RewardService from '../../services/RewardService';
import MemberService from '../../services/MemberService';
import AccountService from '../../services/AccountService';
import WithdrawalService from '../../services/WithdrawalService';

import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { RewardDocument } from '../../models/Reward';
import { WithdrawalDocument } from '../../models/Withdrawal';
import { IAccount } from '../../models/Account';

const ERROR_REWARD_NOT_FOUND = 'The reward for this ID does not exist.';
const ERROR_ACCOUNT_NO_ADDRESS = 'The authenticated account has not wallet address. Sign in the Web Wallet once.';
const ERROR_REWARD_ALREADY_CLAIMED = 'Reward already claimed for this address.';

export const postRewardClaim = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getReward(rewardId: number) {
        const { reward, error } = await RewardService.get(req.assetPool, rewardId);

        if (error) {
            return next(new HttpError(500, error.message, error));
        }

        if (!reward) {
            throw new Error(ERROR_REWARD_NOT_FOUND);
        }

        return reward;
    }

    async function getAccount(sub: string) {
        const { account } = await AccountService.getById(sub);

        if (!account.address) {
            return next(new HttpError(500, ERROR_ACCOUNT_NO_ADDRESS));
        }
        return account;
    }

    async function checkIsMember(address: string) {
        const { isMember, error } = await MemberService.isMember(req.assetPool, address);

        if (error) {
            return next(new HttpError(500, error.message, error));
        }
        return isMember;
    }

    async function addMember(address: string) {
        const { error } = await MemberService.addMember(req.assetPool, address);

        if (error) {
            return next(new HttpError(500, error.message, error));
        }
    }

    async function addMembership(sub: string) {
        const { error } = await AccountService.addMembership(sub, req.assetPool);

        if (error) {
            return next(new HttpError(500, error.message, error));
        }
    }

    async function checkCanClaim(reward: RewardDocument, address: string) {
        const { canClaim, error } = await RewardService.canClaim(reward, address);

        if (error) {
            return next(new HttpError(500, error.message, error));
        }

        if (!canClaim) {
            throw new Error(ERROR_REWARD_ALREADY_CLAIMED);
        }

        return canClaim;
    }

    async function claimRewardOnce(rewardId: number, address: string) {
        const { withdrawal, error } = await RewardService.claimRewardForOnce(req.assetPool, rewardId, address);

        if (error) {
            throw new Error('ClaimRewardForOnce failed');
        }

        if (!withdrawal) {
            throw new Error('No withdrawal found failed');
        }

        return withdrawal;
    }

    async function canBypassWithdrawPoll(account: IAccount) {
        const { canBypassPoll, error } = await AssetPoolService.canBypassWithdrawPoll(req.assetPool, account);
        if (error) {
            return next(new HttpError(500, error.message, error));
        }
        return canBypassPoll;
    }

    async function finalizeWithdrawPoll(withdrawal: WithdrawalDocument) {
        const { finalizedWithdrawal, error } = await WithdrawalService.withdrawPollFinalize(
            req.assetPool,
            withdrawal.id,
        );

        if (error) {
            return next(new HttpError(500, error.message, error));
        }
        return finalizedWithdrawal;
    }

    const rewardId = Number(req.params.id);
    const reward = await getReward(rewardId);
    const account = await getAccount(req.user.sub);
    const isMember = await checkIsMember(account.address);

    if (!reward) return next(new HttpError(500, ERROR_REWARD_NOT_FOUND));

    if (!isMember) {
        await addMember(account.address);
        await addMembership(account.id);
    }

    const canClaim = await checkCanClaim(reward, account.address);

    if (canClaim) {
        let withdrawal = await claimRewardOnce(rewardId, account.address);

        if (withdrawal && (await canBypassWithdrawPoll(account))) {
            const finalizedWithdrawal = await finalizeWithdrawPoll(withdrawal);

            if (finalizedWithdrawal) {
                withdrawal = finalizedWithdrawal;
            }
        }

        res.status(200).json(withdrawal);
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
