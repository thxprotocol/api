import { Request, Response } from 'express';
import AssetPoolService from '@/services/AssetPoolService';

export const getAssetPools = async (req: Request, res: Response) => {
    const result = await AssetPoolService.getAll(req.user.sub);
    res.json(result);
};
