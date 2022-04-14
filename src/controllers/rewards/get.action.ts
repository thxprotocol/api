import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { TReward } from '@/models/Reward';
import WithdrawalService from '@/services/WithdrawalService';

export const getRewards = async (req: Request, res: Response) => {
    const result: TReward[] = [];
    const rewards = await RewardService.findByPoolAddress(req.assetPool);

    for (const r of rewards) {
        const rewardId = Number(r.id);
        const withdrawals = await WithdrawalService.findByQuery({ poolAddress: req.assetPool.address, rewardId });

        result.push({
            id: rewardId,
            poolAddress: req.assetPool.address,
            withdrawLimit: r.withdrawLimit,
            withdrawAmount: r.withdrawAmount,
            withdrawDuration: Number(r.withdrawDuration),
            withdrawCondition: r.withdrawCondition,
            isClaimOnce: r.isClaimOnce,
            isMembershipRequired: r.isMembershipRequired,
            progress: withdrawals.length,
            state: r.state,
        });
    }

    res.json(result);
};
