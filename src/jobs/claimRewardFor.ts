import { Job } from 'agenda';
import { agenda } from '../util/agenda';
import { checkGasPrice } from '../util/gas';
import { logger } from '../util/logger';
import { parseJobData } from '../util/agenda';

import RewardService from '../services/RewardService';
import WithdrawalService from '../services/WithdrawalService';

agenda.define('claimRewardFor', async (job: Job) => {
    const { assetPool, data } = await parseJobData(job);

    if (await checkGasPrice(assetPool.network)) {
        job.schedule('in 5 seconds');
        await job.save();
    } else {
        const args = JSON.parse(data.args);
        const rewardId = args[0];
        const beneficiary = args[1];

        await RewardService.claimRewardFor(assetPool, data.id, rewardId, beneficiary);
    }
});

agenda.on('success:claimRewardFor', async (job: Job) => {
    try {
        const { data, id } = await parseJobData(job);
        const { withdrawal } = await WithdrawalService.getById(data.id);

        await job.remove();

        withdrawal.jobId = null;
        await withdrawal.save();

        logger.info({ jobId: id, withdrawal: withdrawal._id.toString() });
    } catch (error) {
        logger.error({ error: error.toString() });
    }
});

agenda.on('fail:claimRewardFor', async (error: Error, job: Job) => {
    try {
        const { data, id } = await parseJobData(job);
        const { withdrawal } = await WithdrawalService.getById(data.id);

        await job.remove();
        await withdrawal.remove();

        logger.error({ jobId: id, error: error.toString() });
    } catch (error) {
        logger.error({ error: error.toString() });
    }
});
