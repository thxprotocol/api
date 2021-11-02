import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { WIDGETS_URL } from '../../util/secrets';
import WidgetService from '../../services/WidgetService';
import ClientService from '../../services/ClientService';

export const postWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { client, error } = await ClientService.create(req.user.sub, {
            application_type: 'web',
            grant_types: ['authorization_code'],
            request_uris: req.body.requestUris,
            redirect_uris: [WIDGETS_URL],
            post_logout_redirect_uris: req.body.postLogoutRedirectUris,
            response_types: ['code'],
            scope: 'openid user widget',
        });

        if (error) throw new Error(error.message);

        const { widget } = await WidgetService.create(
            req.user.sub,
            client.clientId,
            req.body.metadata.rewardId,
            req.body.metadata.poolAddress,
        );

        res.status(201).json(widget);
    } catch (e) {
        return next(new HttpError(502, 'Could not register your widget.'));
    }
};
