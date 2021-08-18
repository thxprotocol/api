import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { AssetPool } from '../../models/AssetPool';

export const getAssetPools = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const pools = (await AssetPool.find({ sub: req.user.sub })).map((pool) => pool.address);
        res.json(pools);
    } catch (e) {
        return next(new HttpError(500, 'Could not get the asset pools for your user.', e));
    }
};
