import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../../models/Error';
import { Widget } from '../../../models/Widget';

export async function validateClientAccess(req: HttpRequest, res: Response, next: NextFunction) {
    const widget = await Widget.findOne({ rat: req.params.rat });

    if (widget.sub !== req.user.sub) {
        return next(new HttpError(403, 'Could not access this client for your user.'));
    }
    next();
}
