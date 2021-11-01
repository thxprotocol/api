import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';

const ERROR_WIDGET_FETCH_DATEBASE = 'Could not fetch widgets from database';

export const getWidgets = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await WidgetService.getForUserByPool(req.user.sub, req.query.asset_pool.toString());

        if (error) throw new Error(ERROR_WIDGET_FETCH_DATEBASE);

        res.json(result);
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
