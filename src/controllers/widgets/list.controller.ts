import { Request, Response } from 'express';
import WidgetService from '@/services/WidgetService';

export const getWidgets = async (req: Request, res: Response) => {
    // #swagger.tags = ['Widgets']
    const result = await WidgetService.getForUserByPool(req.user.sub, req.query.asset_pool.toString());

    res.json(result);
};
