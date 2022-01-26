import { Job } from 'agenda';
import { agenda, parseJobData } from '../util/agenda';
import { checkGasPrice } from '../util/gas';
import { logger } from '../util/logger';

import WithdrawalService from '../services/WithdrawalService';

agenda.define('proposeWithdraw', async (job: Job) => {
    const { assetPool, data } = await parseJobData(job);

    if (await checkGasPrice(assetPool.network)) {
        job.schedule('in 5 seconds');
        await job.save();
    } else {
        const args = JSON.parse(data.args);
        const beneficiary = args[0];
        const amount = args[1];

        await WithdrawalService.proposeWithdraw(assetPool, data.id, beneficiary, amount);
    }
});

agenda.on('success:proposeWithdraw', async (job: Job) => {
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

agenda.on('fail:proposeWithdraw', async (error: Error, job: Job) => {
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
