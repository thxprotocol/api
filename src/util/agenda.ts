import { Agenda, Job } from 'agenda';
import { MONGODB_URI } from './secrets';
import { logger } from './logger';
import { Withdrawal, WithdrawalType } from '../models/Withdrawal';
import { ERROR_GAS_PRICE_EXCEEDS_CAP } from '../util/network';

import { jobClaimReward } from '../controllers/rewards/postRewardClaim.action';
import { jobClaimRewardFor } from '../controllers/rewards/postRewardClaimFor.action';
import { jobProposeWithdraw } from '../controllers/withdrawals/post.action';

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
    for (const index in withdrawals) {
        const w = withdrawals[index];
        const documentId = w._id.toString();
        const { assetPool } = await AssetPoolService.getByAddress(w.poolAddress);

        // Pass a reference to the withdrawal in this job attr data
        // so we can check for the failReason and update the
        // withdrawal document accordingly if it fails.
        job.attrs.data = {
            documentId,
        };
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
});

// The complete:* event is cast for both success and fail scenarios
agenda.on(`complete:${eventNameProcessWithdrawals}`, async (job: Job) => {
    job.schedule('in 5 seconds');
    await job.save();
});

agenda.on('start', (job: Job) => {
    logger.info({ id: job.attrs._id.toString(), job: job.attrs.name, status: 'start' });
});
agenda.on('fail', (error: Error, job: Job) => {
    logger.error({ id: job.attrs._id.toString(), job: job.attrs.name, status: 'fail', error: error.toString() });
});
agenda.on('success', (job: Job) => {
    logger.info({ id: job.attrs._id.toString(), job: job.attrs.name, status: 'success' });
});
