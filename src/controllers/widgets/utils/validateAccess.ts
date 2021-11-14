import { NextFunction, Response } from 'express';
import ClientService from '../../../services/ClientService';
import { HttpError, HttpRequest } from '../../../models/Error';

export async function validateClientAccess(req: HttpRequest, res: Response, next: NextFunction) {
    const { client } = await ClientService.get(req.params.clientId);
    if (client?.sub !== req.user.sub) {
        return next(new HttpError(403, 'Could not access this client for your user.'));
    }
    next();
}
