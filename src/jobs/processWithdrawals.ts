import { WithdrawalDocument } from '@/models/Withdrawal';
import { WithdrawalType } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { logger } from '@/util/logger';
import { MaxFeePerGasExceededError } from '@/util/network';

import MembershipService from '@/services/MembershipService';
import AssetPoolService from '@/services/AssetPoolService';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import { wrapBackgroundTransaction } from '@/util/newrelic';
import { THXError } from '@/util/errors';

async function claimReward(assetPool: AssetPoolDocument, id: string, rewardId: number, sub: string) {
    const account = await AccountProxy.getById(sub);
    if (!account) throw new THXError('No account found for address');

    const reward = await RewardService.get(assetPool, rewardId);
    if (!reward) throw new THXError('No reward found for this withdrawal');

    const canClaim = await RewardService.canClaim(assetPool, reward, account);
    if (!canClaim) throw new THXError('Claim conditions are currently not valid.');

    const isMember = await MemberService.isMember(assetPool, account.address);
    if (!isMember && !reward.isMembershipRequired) {
        await MemberService.addMember(assetPool, account.address);
    }

    const hasMembership = await MembershipService.hasMembership(assetPool, account.id);
    if (!hasMembership && !reward.isMembershipRequired) {
        await MembershipService.addMembership(account.id, assetPool);
    }

    await RewardService.claimRewardFor(assetPool, id, rewardId, account);
}

async function updateFailReason(withdrawal: WithdrawalDocument, failReason: string) {
    withdrawal.failReason = failReason;
    await withdrawal.save();
}

export async function jobProcessWithdrawals() {
    for (const assetPool of await AssetPoolService.getAll()) {
        for (const w of await WithdrawalService.getAllScheduled(assetPool.address)) {
            try {
                switch (w.type) {
                    case WithdrawalType.ClaimReward: {
                        await wrapBackgroundTransaction(
                            'jobClaimReward',
                            'processWithdrawal',
                            claimReward(assetPool, String(w._id), w.rewardId, w.sub),
                        );
                        break;
                    }
                    case WithdrawalType.ClaimRewardFor: {
                        const account = await AccountProxy.getById(w.sub);
                        await wrapBackgroundTransaction(
                            'jobClaimRewardFor',
                            'processWithdrawal',
                            RewardService.claimRewardFor(assetPool, String(w._id), w.rewardId, account),
                        );
                        break;
                    }
                    case WithdrawalType.ProposeWithdraw: {
                        await wrapBackgroundTransaction(
                            'jobProposeWithdraw',
                            'processWithdrawal',
                            WithdrawalService.proposeWithdraw(assetPool, String(w._id), w.sub, w.amount),
                        );
                        break;
                    }
                }
                // If no error is thrown remove the failReason that potentially got stored in
                // an earlier run.
                if (w.failReason) {
                    await updateFailReason(w, '');
                }
            } catch (error) {
                await updateFailReason(w, error.message);

                const level = error instanceof MaxFeePerGasExceededError ? 'info' : 'error';
                logger.log(level, {
                    withdrawalFailed: {
                        withdrawalId: String(w._id),
                        withdrawalType: w.type,
                        error: error.message,
                    },
                });

                // Stop processing the other queued withdrawals if fee is too high per gas.
                if (error instanceof MaxFeePerGasExceededError) {
                    throw error;
                }
            }
        }
    }
}
