import { Agenda } from 'agenda';
import { MONGODB_URI } from './secrets';
import { Job } from 'agenda';
import { solutionContract } from './network';
import AssetPoolService from '../services/AssetPoolService';

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

agenda.on('complete', (job) => {
    console.log(`Job ${job.attrs.name} finished`);
});

agenda.on('start', (job) => {
    console.log('Job %s starting', job.attrs.name);
});
