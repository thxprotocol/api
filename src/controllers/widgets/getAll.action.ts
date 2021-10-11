import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';

export const getWidgets = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { widgets } = await WidgetService.getAll(req.user.sub);
        res.json(widgets);
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
