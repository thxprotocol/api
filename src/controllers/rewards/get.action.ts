import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { TReward } from '@/models/Reward';

export const getRewards = async (req: Request, res: Response) => {
    const result: TReward[] = [];
    const rewards = await RewardService.findByPoolAddress(req.assetPool);

    for (const r of rewards) {
        const totalWithdrawed = await RewardService.rewardProgress(r);

        result.push({
            id: Number(r.id),
            poolAddress: req.assetPool.address,
            withdrawLimit: r.withdrawLimit,
            withdrawAmount: r.withdrawAmount,
            withdrawDuration: Number(r.withdrawDuration),
            withdrawCondition: r.withdrawCondition,
            isClaimOnce: r.isClaimOnce,
            isMembershipRequired: r.isMembershipRequired,
            progress: totalWithdrawed,
            state: r.state,
        });
    }

    res.json(result);
};
