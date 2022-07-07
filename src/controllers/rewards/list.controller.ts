import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import WithdrawalService from '@/services/WithdrawalService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const rewards = await RewardService.findByPool(req.assetPool);
    const result = [];
    for (const r of rewards) {
        const rewardId = Number(r.id);
        const withdrawals = await WithdrawalService.findByQuery({ poolId: String(req.assetPool._id), rewardId });

        result.push({
            _id: String(r._id),
            id: rewardId,
            title: r.title,
            slug: r.slug,
            erc721metadataId: r.erc721metadataId,
            expiryDate: r.expiryDate,
            poolId: req.assetPool._id,
            poolAddress: req.assetPool.address,
            withdrawLimit: r.withdrawLimit,
            withdrawAmount: r.withdrawAmount,
            withdrawDuration: Number(r.withdrawDuration),
            withdrawCondition: r.withdrawCondition,
            withdrawUnlockDate: r.withdrawUnlockDate,
            isClaimOnce: r.isClaimOnce,
            isMembershipRequired: r.isMembershipRequired,
            progress: withdrawals.length,
            state: r.state,
            claimId: r.claimId,
        });
    }

    res.json(result);
};

export default { controller };
