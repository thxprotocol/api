import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import RatService from '../../services/RatService';
import ClientService from '../../services/ClientService';

export const getClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { rat } = await RatService.get(req.params.rat);

        if (!rat) {
            return next(new HttpError(500, 'Could not find this registration_access_token.'));
        }

        const { client } = await ClientService.get(rat.payload['clientId']);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this registration_access_token.'));
        }

        res.json({
            requestUris: client.payload['request_uris'],
            clientId: client.payload['client_id'],
            clientSecret: client.payload['client_secret'],
            registrationAccessToken: req.params.rat,
        });
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
