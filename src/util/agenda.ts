import { Agenda, Job } from 'agenda';
import { MONGODB_URI } from './secrets';
import { logger } from './logger';
import { Withdrawal, WithdrawalType } from '../models/Withdrawal';

import { jobClaimReward } from '../jobs/claimReward';
import { jobClaimRewardFor } from '../jobs/claimRewardFor';
import { jobProposeWithdraw } from '../jobs/proposeWithdrawal';

import AssetPoolService from '../services/AssetPoolService';
import WithdrawalService from '../services/WithdrawalService';

export const eventNameProcessWithdrawals = 'processWithdrawals';

export const agenda = new Agenda({
    db: {
        address: MONGODB_URI,
        collection: 'jobs',
    },
    maxConcurrency: 1,
});

async function updateFailReason(id: string, failReason: string) {
    const withdrawal = await Withdrawal.findById(id);
    if (withdrawal) {
        withdrawal.failReason = failReason;
        await withdrawal.save();
    }
}

agenda.define(eventNameProcessWithdrawals, async (job: Job) => {
    const withdrawals = await WithdrawalService.getAllScheduled();

    for (const w of withdrawals) {
        const documentId = String(w._id);
        const { assetPool } = await AssetPoolService.getByAddress(w.poolAddress);

        // Pass a reference to the withdrawal in this job attr data
        // so we can check for the failReason and update the
        // withdrawal document accordingly if it fails.
        job.attrs.data = { documentId };
        await job.save();

        switch (w.type) {
            case WithdrawalType.ClaimReward:
                await jobClaimReward(assetPool, w.id, w.rewardId, w.beneficiary);
                break;
            case WithdrawalType.ClaimRewardFor:
                await jobClaimRewardFor(assetPool, w.id, w.rewardId, w.beneficiary);
                break;
            case WithdrawalType.ProposeWithdraw:
                await jobProposeWithdraw(assetPool, w.id, w.amount, w.beneficiary);
                break;
        }
        // If no error is caught remove the failReason that potentially got stored in
        // an earlier run.
        if (w.failReason) await updateFailReason(documentId, '');
    }
});

agenda.on(`fail:${eventNameProcessWithdrawals}`, async (error: Error, job: Job) => {
    await updateFailReason(job.attrs.data.documentId, error.message);
    logger.error({ id: String(job.attrs._id), job: job.attrs.name, status: 'fail', error: error.message });
});
