import { Request, Response } from 'express';
import { AssetPoolDocument } from '@/models/AssetPool';
import AssetPoolService from '@/services/AssetPoolService';
import { query } from 'express-validator';

export const validation = [query('archived').optional().isBoolean()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Pools']
    const pools = await AssetPoolService.getAllBySub(req.auth.sub);
    const archived = req.query.archived == 'true' ? true : false;
    const list = pools.filter((x) => x.archived === archived).map((pool: AssetPoolDocument) => pool._id);

    res.json(list);
};

export default { controller, validation };
