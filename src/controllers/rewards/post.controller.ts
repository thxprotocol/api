import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';

export const postReward = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']

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

    res.status(201).json(reward);
};
