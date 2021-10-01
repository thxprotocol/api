import { downgradeFromBypassPolls, updateToBypassPolls } from '../../util/upgrades';
import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';
import { callFunction } from '../../util/network';
import { sendTransaction } from '../../util/network';

export const patchAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const { assetPool, error } = await AssetPoolService.findAssetPool(req.solution.options.address);
    if (error) throw new Error(error);
    if (!assetPool) {
        return next(new HttpError(404, 'Could not find an asset pool for this address.'));
    }

    if (req.body.bypassPolls === true && assetPool.bypassPolls === false) {
        try {
            const { error } = await AssetPoolService.bypassAssetPools('update', assetPool, req);
            if (error) throw new Error(error);
        } catch (error) {
            return next(new HttpError(502, 'Could not update set bypassPolls (true) for this asset pool.', error));
        }
    }

    if (req.body.bypassPolls === false && assetPool.bypassPolls === true) {
        try {
            const { error } = await AssetPoolService.bypassAssetPools('downgrade', assetPool, req);
            if (error) throw new Error(error);
        } catch (error) {
            return next(new HttpError(502, 'Could not update set bypassPolls (false) for this asset pool.', error));
        }
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
