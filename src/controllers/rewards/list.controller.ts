import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';
import ClaimService from '@/services/ClaimService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const rewards = await RewardService.findByPool(req.assetPool);

    const result = [];
    for (const r of rewards) {
        const rewardId = String(r.id);
        const withdrawals = await WithdrawalService.findByQuery({
            poolId: String(req.assetPool._id),
            rewardId,
        });
        const claims = await ClaimService.findByReward(r);

        result.push({
            claims,
            id: rewardId,
            progress: withdrawals.length,
            ...r.toJSON(),
        });
    }

    res.json(result);
};

export default { controller };
