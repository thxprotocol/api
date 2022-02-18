import { Request, Response } from 'express';
import { body } from 'express-validator';
import AssetPoolService from '@/services/AssetPoolService';

export const updateAssetPoolValidation = [
    body('bypassPolls').optional().isBoolean(),
    body('rewardPollDuration').optional().isNumeric(),
    body('proposeWithdrawPollDuration').optional().isNumeric(),
];

export const patchAssetPool = async (req: Request, res: Response) => {
    const { assetPool } = await AssetPoolService.getByAddress(req.params.address);

    await AssetPoolService.update(assetPool, {
        rewardPollDuration: req.body.rewardPollDuration,
        proposeWithdrawPollDuration: req.body.proposeWithdrawPollDuration,
        bypassPolls: req.body.bypassPolls,
    });

    res.status(200).end();
};
