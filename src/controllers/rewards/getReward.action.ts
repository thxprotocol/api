import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { TReward } from '@/models/Reward';

export const getReward = async (req: Request, res: Response) => {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError();

    const result: TReward = {
        id: reward.id,
        withdrawAmount: reward.withdrawAmount,
        withdrawDuration: reward.withdrawDuration,
        withdrawCondition: reward.withdrawCondition,
        isClaimOnce: reward.isClaimOnce,
        isMembershipRequired: reward.isMembershipRequired,
        poolAddress: req.assetPool.address,
        state: reward.state,
    };

    res.json(result);
};
