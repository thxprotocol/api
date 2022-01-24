import { JobAttributesData } from 'agenda';
import { IAssetPool } from '../models/AssetPool';
import { agenda } from '../util/agenda';

export default class JobService {
    static async getJob(jobId: string): Promise<JobAttributesData> {
        const jobs = await agenda.jobs({ _id: jobId });
        const job = jobs[0];

        return job;
    }

    static async proposeWithdraw(assetPool: IAssetPool, id: string, beneficiary: string, amount: number) {
        const data = {
            id,
            to: assetPool.solution.options.address,
            args: JSON.stringify([beneficiary, amount]),
            npid: assetPool.network,
        };
        const job = agenda.create('proposeWithdraw', data);

        return await job.save();
    }

    static async claimRewardFor(assetPool: IAssetPool, id: string, rewardId: number, beneficiary: string) {
        const data = {
            id,
            to: assetPool.solution.options.address,
            args: JSON.stringify([rewardId, beneficiary]),
            npid: assetPool.network,
        };
        const job = agenda.create('claimRewardFor', data);

        return await job.save();
    }

    static async claimReward(
        assetPool: IAssetPool,
        id: string,
        rewardId: number,
        beneficiary: string,
        shouldAddMember: boolean,
    ) {
        const data = {
            id,
            shouldAddMember,
            to: assetPool.solution.options.address,
            args: JSON.stringify([rewardId, beneficiary]),
            npid: assetPool.network,
        };
        const job = agenda.create('claimReward', data);

        return await job.save();
    }
}
