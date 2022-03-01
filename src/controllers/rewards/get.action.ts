import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { TReward } from '@/models/Reward';

export const getRewards = async (req: Request, res: Response) => {
    const result: TReward[] = [];
    const rewards = await RewardService.findByPoolAddress(req.assetPool);

    for (const r of rewards) {
        const poll = r.pollId > 0 ? { poll: await RewardService.getRewardPoll(req.assetPool, r.pollId) } : {};

        result.push({
            id: Number(r.id),
            poolAddress: req.assetPool.address,
            withdrawAmount: r.withdrawAmount,
            withdrawDuration: Number(r.withdrawDuration),
            withdrawCondition: r.withdrawCondition,
            isClaimOnce: r.isClaimOnce,
            isMembershipRequired: r.isMembershipRequired,
            state: r.state,
            pollId: Number(r.pollId),
            ...poll,
        });
    }

    res.json(result);
};
