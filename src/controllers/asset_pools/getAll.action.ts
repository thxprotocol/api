import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';

export const getAssetPools = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await AssetPoolService.getAssetPools(req.user.sub);
        if (error) throw new Error(error);
        res.json(result);
    } catch (e) {
        return next(new HttpError(500, 'Could not get the asset pools for your user.', e));
    }
};
