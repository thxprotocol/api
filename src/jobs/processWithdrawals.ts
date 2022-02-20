import { WithdrawalDocument } from '@/models/Withdrawal';
import { WithdrawalType } from '@/enums/WithdrawalType';
import { AssetPoolDocument } from '@/models/AssetPool';
import { logger } from '@/util/logger';
import { ERROR_MAX_FEE_PER_GAS } from '@/util/network';

import MembershipService from '@/services/MembershipService';
import AssetPoolService from '@/services/AssetPoolService';
import AccountProxy from '@/proxies/AccountProxy';
import RewardService from '@/services/RewardService';
import MemberService from '@/services/MemberService';
import WithdrawalService from '@/services/WithdrawalService';
import { wrapBackgroundTransaction } from '@/util/newrelic';

const ERROR_CAN_NOT_CLAIM = 'Claim conditions are currently not valid.';

async function claimReward(assetPool: AssetPoolDocument, id: string, rewardId: number, beneficiary: string) {
    const { account } = await AccountProxy.getByAddress(beneficiary);
    const { reward } = await RewardService.get(assetPool, rewardId);
    const { canClaim } = await RewardService.canClaim(assetPool, reward, account);
    const { isMember } = await MemberService.isMember(assetPool, beneficiary);
    const shouldAddMember = !reward.isMembershipRequired && !isMember;

    if (!canClaim) {
        throw new Error(ERROR_CAN_NOT_CLAIM);
    }

    if (shouldAddMember) {
        await MemberService.addMember(assetPool, beneficiary);
        await MembershipService.addMembership(account.id, assetPool);
    }

    await RewardService.claimRewardFor(assetPool, id, rewardId, beneficiary);
}

async function updateFailReason(withdrawal: WithdrawalDocument, failReason: string) {
    withdrawal.failReason = failReason;
    await withdrawal.save();
}

export async function jobProcessWithdrawals() {
    const withdrawals = await WithdrawalService.getAllScheduled();
    for (const w of withdrawals) {
        const assetPool = await AssetPoolService.getByAddress(w.poolAddress);

        try {
            switch (w.type) {
                case WithdrawalType.ClaimReward:
                    await wrapBackgroundTransaction(
                        'jobClaimReward',
                        'processWithdrawal',
                        claimReward(assetPool, w.id, w.rewardId, w.beneficiary),
                    );
                    break;
                case WithdrawalType.ClaimRewardFor:
                    await wrapBackgroundTransaction(
                        'jobClaimRewardFor',
                        'processWithdrawal',
                        RewardService.claimRewardFor(assetPool, w.id, w.rewardId, w.beneficiary),
                    );
                    break;
                case WithdrawalType.ProposeWithdraw:
                    await wrapBackgroundTransaction(
                        'jobProposeWithdraw',
                        'processWithdrawal',
                        WithdrawalService.proposeWithdraw(assetPool, w.id, w.beneficiary, w.amount),
                    );
                    break;
            }
            // If no error is thrown remove the failReason that potentially got stored in
            // an earlier run.
            if (w.failReason) {
                await updateFailReason(w, '');
            }
        } catch (error) {
            await updateFailReason(w, error.message);

            const level = error.message === ERROR_MAX_FEE_PER_GAS ? 'info' : 'error';
            logger.log(level, {
                withdrawalFailed: {
                    withdrawalId: String(w._id),
                    withdrawalType: w.type,
                    error: error.message,
                },
            });

            // Stop processing the other queued withdrawals if fee is too high per gas.
            if (error.message === ERROR_MAX_FEE_PER_GAS) {
                throw error;
            }
        }
    }
}
