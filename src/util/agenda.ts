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

agenda.define(eventNameProcessWithdrawals, async (job: Job) => {
    const withdrawals = await WithdrawalService.getAllScheduled();
    for (const index in withdrawals) {
        const w = withdrawals[index];
        const { assetPool } = await AssetPoolService.getByAddress(w.poolAddress);

        // Pass a reference to the withdrawal in this job attr data
        // so we can check for the failReason and update the
        // withdrawal document accordingly if it fails.
        job.attrs.data = {
            currentWithdrawalDocument: w._id.toString(),
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
    }
});

agenda.on(`fail:${eventNameProcessWithdrawals}`, async (error: Error, job: Job) => {
    // If gas pricing was not the cause of the job failing, then
    // update the related withdrawal with the error message so
    // users can re-enqueue the item from the UI if required.
    if (error.message !== ERROR_GAS_PRICE_EXCEEDS_CAP) {
        try {
            const id = job.attrs.data.currentWithdrawalDocument;
            const withdrawal = await Withdrawal.findById(id);

            withdrawal.failReason = error.message;
            await withdrawal.save();
        } catch (error) {
            logger.error({ error: error.message });
        }
    }
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
