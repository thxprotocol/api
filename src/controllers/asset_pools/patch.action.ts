import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';
import { callFunction } from '../../util/network';
import { sendTransaction } from '../../util/network';

export const patchAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const { assetPool, error } = await AssetPoolService.getByAddress(req.params.address);

    if (error) throw new Error(error);

    if (!assetPool) {
        return next(new HttpError(404, 'Could not find an asset pool for this address.'));
    }

    try {
        await AssetPoolService.update(assetPool, {
            rewardPollDuration: req.body.rewardPollDuration,
            proposeWithdrawPollDuration: req.body.proposeWithdrawPollDuration,
            bypassPolls: req.body.bypassPolls,
        });
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }

    res.status(200).end();
};
