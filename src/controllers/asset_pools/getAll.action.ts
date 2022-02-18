import { Request, Response, NextFunction } from 'express';
import AssetPoolService from '@/services/AssetPoolService';

export const getAssetPools = async (req: Request, res: Response, next: NextFunction) => {
    const { result } = await AssetPoolService.getAll(req.user.sub);
    res.json(result);
};
