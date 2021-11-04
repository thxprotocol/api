import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';

export const getWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { client } = await ClientService.get(req.params.clientId);

        if (!client) {
            return next(new HttpError(500, 'Could not find a client for this clientId.'));
        }

        const { widget } = await WidgetService.get(req.params.clientId);

        if (!widget) {
            return next(new HttpError(500, 'Could not find a widget for this clientId.'));
        }

        res.json({
            requestUris: client.requestUris,
            clientId: client.clientId,
            clientSecret: client.clientSecret,
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
