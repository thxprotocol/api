import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import AssetPoolService from '../../services/AssetPoolService';

export const getAssetPools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await AssetPoolService.getAll(req.user.sub);
        if (error) throw new Error(error);
        res.json(result);
    } catch (e) {
        return next(new HttpError(500, 'Could not get the asset pools for your user.', e));
    }
};
