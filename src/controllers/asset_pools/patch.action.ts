import { downgradeFromBypassPolls, updateToBypassPolls } from '../../util/upgrades';
import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';
import { callFunction } from '../../util/network';
import { sendTransaction } from '../../util/network';

export const patchAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const { assetPool, error } = await AssetPoolService.findByAddress(req.solution.options.address);
    if (error) throw new Error(error);
    if (!assetPool) {
        return next(new HttpError(404, 'Could not find an asset pool for this address.'));
    }
    try {
        const { error } = await AssetPoolService.patch(assetPool, req.body.bypassPolls, req.solution);
        if (error) {
            return next(new HttpError(502, error));
        }
    } catch (error) {
        return next(new HttpError(502, 'Could not update the bypassPolls for this asset pool.', error));
    }

    const rewardPollDuration = await callFunction(req.solution.methods.getRewardPollDuration(), req.assetPool.network);
    if (req.body.rewardPollDuration && Number(rewardPollDuration) !== req.body.rewardPollDuration) {
        try {
            await sendTransaction(
                req.solution.options.address,
                req.solution.methods.setRewardPollDuration(req.body.rewardPollDuration),
                req.assetPool.network,
            );
        } catch (error) {
            return next(new HttpError(502, 'Could not update the rewardPollDuration for this asset pool.', error));
        }
    }

    const proposeWithdrawPollDuration = await callFunction(
        req.solution.methods.getProposeWithdrawPollDuration(),
        req.assetPool.network,
    );
    if (
        req.body.proposeWithdrawPollDuration &&
        Number(proposeWithdrawPollDuration) !== req.body.proposeWithdrawPollDuration
    ) {
        try {
            await sendTransaction(
                req.solution.options.address,
                req.solution.methods.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration),
                req.assetPool.network,
            );
        } catch (error) {
            return next(
                new HttpError(502, 'Could not update the proposeWithdrawPollDuration for this asset pool.', error),
            );
        }
    }

    res.status(200).end();
};
