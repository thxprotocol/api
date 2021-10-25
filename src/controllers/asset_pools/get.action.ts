import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';

export const getAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { assetPool, error } = await AssetPoolService.getByAddress(req.params.address);

        if (error) {
            return next(new HttpError(500, 'Could not get this asset pool.'));
        } else {
            const { token, error } = await AssetPoolService.getPoolToken(req.assetPool);

            if (error) {
                throw new Error(error);
            }

            res.json({
                address: req.params.address,
                ...{
                    sub: assetPool.sub,
                    rat: assetPool.rat,
                    address: assetPool.address,
                    network: assetPool.network,
                    bypassPolls: assetPool.bypassPolls,
                    proposeWithdrawPollDuration: assetPool.proposeWithdrawPollDuration,
                    rewardPollDuration: assetPool.rewardPollDuration,
                },
                token,
            });
        }
    } catch (error) {
        return next(new HttpError(500, 'Could not obtain Asset Pool data from the network.', error));
    }
};
