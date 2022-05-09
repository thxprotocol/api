import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { NotFoundError } from '@/util/errors';
import { TReward } from '@/models/Reward';
import { param } from 'express-validator';
import WithdrawalService from '@/services/WithdrawalService';

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
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
        erc721metadataId: reward.erc721metadataId,
        expiryDate: reward.expiryDate,
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

export default { controller, validation };
