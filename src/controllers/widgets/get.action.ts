import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';
import RatService from '../../services/RatService';

export const getWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { rat } = await RatService.get(req.params.rat);

        if (!rat) {
            return next(new HttpError(500, 'Could not find this registration_access_token.'));
        }

        const { client } = await ClientService.get(rat.payload['clientId']);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this registration_access_token.'));
        }

        const { widget } = await WidgetService.getByIdAndAddress(rat.payload.jti, req.query.asset_pool.toString());

        if (!widget) {
            return next(new HttpError(500, 'Could not find a widget for this registration_access_token.'));
        }

        res.json({
            requestUris: client.payload['request_uris'],
            clientId: client.payload['client_id'],
            clientSecret: client.payload['client_secret'],
            registrationAccessToken: req.params.rat,
            metadata: {
                rewardId: widget.metadata.rewardId,
                poolAddress: widget.metadata.poolAddress,
            },
        });
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};
