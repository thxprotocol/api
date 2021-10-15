import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';

export const getWidgets = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { result } = await WidgetService.getAll(req.user.sub);
        res.json(result);
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
