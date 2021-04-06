import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import MongoAdapter from '../../oidc/adapter';

export const deleteClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const Client = new MongoAdapter('client');
        await Client.coll().delete({ _id: req.user.sub });

        res.status(204).end();
    } catch (e) {
        next(new HttpError(502, 'Account remove failed.', e));
    }
};
