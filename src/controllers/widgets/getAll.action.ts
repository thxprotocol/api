import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { Widget } from '../../models/Widget';

export const getWidgets = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const widgets = (await Widget.find({ sub: req.user.sub })).map((widget) => widget.rat);

        res.json(widgets);
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
