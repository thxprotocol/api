import { Agenda } from 'agenda';
import { logger } from './logger';
import { WithdrawalDocument, WithdrawalType } from '../models/Withdrawal';

import { jobClaimReward } from '../jobs/claimReward';
import { jobClaimRewardFor } from '../jobs/claimRewardFor';
import { jobProposeWithdraw } from '../jobs/proposeWithdrawal';

import AssetPoolService from '../services/AssetPoolService';
import WithdrawalService from '../services/WithdrawalService';
import { ERROR_MAX_FEE_PER_GAS } from './network';
import db from './database';
import { wrapBackgroundTransaction } from '@/util/newrelic';

export const eventNameProcessWithdrawals = 'processWithdrawals';
export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

async function updateFailReason(withdrawal: WithdrawalDocument, failReason: string) {
    withdrawal.failReason = failReason;
    await withdrawal.save();
}

agenda.define(eventNameProcessWithdrawals, async () => {
    const withdrawals = await WithdrawalService.getAllScheduled();
    for (const w of withdrawals) {
        const { assetPool } = await AssetPoolService.getByAddress(w.poolAddress);

        try {
            switch (w.type) {
                case WithdrawalType.ClaimReward:
                    await wrapBackgroundTransaction(
                        'jobClaimReward',
                        'processWithdrawal',
                        jobClaimReward(assetPool, w.id, w.rewardId, w.beneficiary),
                    );
                    break;
                case WithdrawalType.ClaimRewardFor:
                    await wrapBackgroundTransaction(
                        'jobClaimRewardFor',
                        'processWithdrawal',
                        jobClaimRewardFor(assetPool, w.id, w.rewardId, w.beneficiary),
                    );
                    break;
                case WithdrawalType.ProposeWithdraw:
                    await wrapBackgroundTransaction(
                        'jobProposeWithdraw',
                        'processWithdrawal',
                        jobProposeWithdraw(assetPool, w.id, w.amount, w.beneficiary),
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
});

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs', function (err) {
        logger.error(err);
    });
    await agenda.start();
    agenda.every('5 seconds', eventNameProcessWithdrawals);
});
