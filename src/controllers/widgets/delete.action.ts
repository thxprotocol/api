import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';

export const deleteWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { client } = await ClientService.get(req.params.clientId);

        if (!client) {
            return next(new HttpError(500, 'Could not find a widget for this clientId.'));
        }
        const { error } = await WidgetService.remove(req.params.clientId);
        if (error) {
            throw new Error(error);
        } else {
            await ClientService.remove(req.params.clientId);
            
            res.status(204).end();
        }
    } catch (e) {
        next(new HttpError(500, 'Could not remove a widget for this clientId.', e));
    }
};
