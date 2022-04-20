import { Request, Response } from 'express';
import { TReward } from '@/models/Reward';
import RewardService from '@/services/RewardService';

export const postReward = async (req: Request, res: Response) => {
    const reward = await RewardService.create(
        req.assetPool,
        req.body.title,
        req.body.slug,
        req.body.withdrawLimit || 0,
        req.body.withdrawAmount,
        req.body.withdrawDuration,
        req.body.isMembershipRequired,
        req.body.isClaimOnce,
        req.body.withdrawCondition,
    );
    const result: TReward = {
        id: reward.id,
        title: reward.title,
        slug: reward.slug,
        poolAddress: reward.poolAddress,
        state: reward.state,
        isMembershipRequired: reward.isMembershipRequired,
        isClaimOnce: reward.isClaimOnce,
        withdrawAmount: reward.withdrawAmount,
        withdrawDuration: reward.withdrawDuration,
        withdrawCondition: reward.withdrawCondition,
        withdrawLimit: reward.withdrawLimit,
    };

    res.status(201).json(result);
};
