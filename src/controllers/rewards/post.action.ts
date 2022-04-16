import { Request, Response } from 'express';
import { TReward } from '@/models/Reward';
import RewardService from '@/services/RewardService';

export const postReward = async (req: Request, res: Response) => {
    const reward = await RewardService.create(
        req.assetPool,
        req.body.withdrawLimit || 0,
        req.body.withdrawAmount,
        req.body.withdrawDuration,
        req.body.isMembershipRequired,
        req.body.isClaimOnce,
        req.body.withdrawCondition,
        req.body.withdrawUnlockDate || new Date(0),
    );
    const result: TReward = {
        id: reward.id,
        poolAddress: reward.poolAddress,
        state: reward.state,
        isMembershipRequired: reward.isMembershipRequired,
        isClaimOnce: reward.isClaimOnce,
        withdrawAmount: reward.withdrawAmount,
        withdrawDuration: reward.withdrawDuration,
        withdrawCondition: reward.withdrawCondition,
        withdrawLimit: reward.withdrawLimit,
        withdrawUnlockDate: reward.withdrawUnlockDate
    };

    res.status(201).json(result);
};
