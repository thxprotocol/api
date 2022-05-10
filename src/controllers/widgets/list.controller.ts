import { Request, Response } from 'express';
import WidgetService from '@/services/WidgetService';
import { query } from 'express-validator';

const validation = [query('asset_pool').optional().isString()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const result = await WidgetService.getForUserByPool(req.user.sub, req.query.asset_pool.toString());

    res.json(result);
};

export default { controller, validation };
