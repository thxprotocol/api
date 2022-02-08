import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';

export const patchAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    const { assetPool, error } = await AssetPoolService.getByAddress(req.params.address);

    if (error) throw new Error(error);

    if (!assetPool) {
        return next(new HttpError(404, 'Could not find an asset pool for this address.'));
    }

    try {
        const { error } = await AssetPoolService.update(assetPool, {
            rewardPollDuration: req.body.rewardPollDuration,
            proposeWithdrawPollDuration: req.body.proposeWithdrawPollDuration,
            bypassPolls: req.body.bypassPolls,
        });

        if (error) throw new Error(error);

        res.status(200).end();
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
};
