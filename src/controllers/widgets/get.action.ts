import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { Rat } from '../../models/Rat';
import { Client } from '../../models/Client';
import { Widget } from '../../models/Widget';

export const getWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const rat = await Rat.findOne({ _id: req.params.rat });

        if (!rat) {
            return next(new HttpError(500, 'Could not find this registration_access_token.'));
        }

        const client = await Client.findById(rat.payload['clientId']);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this registration_access_token.'));
        }

        const widget = await Widget.findOne({ rat: rat.payload.jti, poolAddress: req.query.asset_pool });

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
