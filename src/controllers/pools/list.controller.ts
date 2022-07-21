import { Request, Response } from 'express';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import { query } from 'express-validator';

export const validation = [query('archived').optional().isBoolean()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    let pools;
    if (req.query.archived == 'true') {
        pools = await AssetPoolService.getAllBySub(req.auth.sub);
    } else {
        pools = await AssetPool.find({ sub: req.auth.sub, archived: false });
    }
    const list = pools.map((pool: AssetPoolDocument) => pool._id);

    res.json(list);
};

export default { controller, validation };
