import { Agenda } from 'agenda';
import { MONGODB_URI } from './secrets';
import { Job } from 'agenda';
import { solutionContract } from './network';
import AssetPoolService from '../services/AssetPoolService';
import { logger } from './logger';

export async function parseJobData(job: Job) {
    const id = job.attrs._id.toString();
    const data = job.attrs.data;
    const solution = solutionContract(data.npid, data.to);
    const { assetPool } = await AssetPoolService.getByAddress(data.to);
    assetPool.solution = solution;

    return { assetPool, id, data };
}

export const agenda = new Agenda({
    db: {
        address: MONGODB_URI,
        collection: 'jobs',
    },
    processEvery: '5 seconds',
});

agenda.on('complete', (job: Job) => {
    logger.info({ job: job.attrs.name, status: 'complete' });
});

agenda.on('start', (job: Job) => {
    logger.info({ job: job.attrs.name, status: 'start' });
});
