import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import WidgetService from '@/services/WidgetService';
import ClientService from '@/services/ClientService';

export const deleteWidget = async (req: Request, res: Response, next: NextFunction) => {
    const client = await ClientService.get(req.params.clientId);

    if (!client) {
        return next(new HttpError(500, 'Could not find a widget for this clientId.'));
    }
    await WidgetService.remove(req.params.clientId);

    await ClientService.remove(req.params.clientId);

    res.status(204).end();
};
