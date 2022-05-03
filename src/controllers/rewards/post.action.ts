import { Request, Response } from 'express';
import { TReward } from '@/models/Reward';
import RewardService from '@/services/RewardService';

export const postReward = async (req: Request, res: Response) => {
    let withdrawUnlockDate = req.body.withdrawUnlockDate;

    if (!withdrawUnlockDate) {
        const now = new Date();
        withdrawUnlockDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    }

    const reward = await RewardService.create({
        assetPool: req.assetPool,
        title: req.body.title,
        slug: req.body.slug,
        withdrawLimit: req.body.withdrawLimit || 0,
        withdrawAmount: req.body.withdrawAmount,
        withdrawDuration: req.body.withdrawDuration,
        isMembershipRequired: req.body.isMembershipRequired,
        isClaimOnce: req.body.isClaimOnce,
        withdrawUnlockDate: new Date(withdrawUnlockDate),
        withdrawCondition: req.body.withdrawCondition,
        expiryDate: req.body.expiryDate,
        erc721metadataId: req.body.erc721metadataId,
    });
    // const result: TReward = {
    //     id: reward.id,
    //     title: reward.title,
    //     slug: reward.slug,
    //     poolAddress: reward.poolAddress,
    //     state: reward.state,
    //     erc721metadataId: reward.erc721metadataId,
    //     isMembershipRequired: reward.isMembershipRequired,
    //     isClaimOnce: reward.isClaimOnce,
    //     withdrawAmount: reward.withdrawAmount,
    //     withdrawDuration: reward.withdrawDuration,
    //     withdrawCondition: reward.withdrawCondition,
    //     withdrawLimit: reward.withdrawLimit,
    //     withdrawUnlockDate: reward.withdrawUnlockDate,
    //     expiryDate: reward.expiryDate,
    // };

    res.status(201).json(reward);
};
