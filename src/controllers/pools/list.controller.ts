import { Request, Response } from 'express';
import { AssetPoolDocument } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const pools = await AssetPoolService.getAllBySub(req.auth.sub);
    const list = pools.map((pool: AssetPoolDocument) => pool._id);

    res.json(list);
};

export default { controller };
