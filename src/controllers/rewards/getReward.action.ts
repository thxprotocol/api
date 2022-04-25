import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { TReward } from '@/models/Reward';
import WithdrawalService from '@/services/WithdrawalService';

export const getReward = async (req: Request, res: Response) => {
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError();

    const withdrawals = await WithdrawalService.findByQuery({
        poolAddress: req.assetPool.address,
        rewardId: reward.id,
    });

    const result: TReward = {
        _id: String(reward._id),
        id: reward.id,
        title: reward.title,
        slug: reward.slug,
        withdrawLimit: reward.withdrawLimit,
        withdrawAmount: reward.withdrawAmount,
        withdrawDuration: reward.withdrawDuration,
        withdrawCondition: reward.withdrawCondition,
        withdrawUnlockDate: reward.withdrawUnlockDate,
        isClaimOnce: reward.isClaimOnce,
        isMembershipRequired: reward.isMembershipRequired,
        poolAddress: req.assetPool.address,
        progress: withdrawals.length,
        state: reward.state,
    };

    res.json(result);
};
