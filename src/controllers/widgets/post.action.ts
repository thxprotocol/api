import axios from 'axios';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { AUTH_URL, WIDGETS_URL } from '../../util/secrets';
import WidgetService from '../../services/WidgetService';

export const postWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const r = await axios({
            method: 'POST',
            url: AUTH_URL + '/reg',
            data: {
                application_type: 'web',
                grant_types: ['authorization_code'],
                request_uris: req.body.requestUris,
                redirect_uris: [WIDGETS_URL],
                post_logout_redirect_uris: req.body.postLogoutRedirectUris,
                response_types: ['code'],
                scope: 'openid user widget',
            },
        });

        const { widget } = await WidgetService.create(
            req.user.sub,
            r.data.registration_access_token,
            req.body.metadata.rewardId,
            req.body.metadata.poolAddress,
        );

        res.status(201).json(widget);
    } catch (e) {
        return next(new HttpError(502, 'Could not register your widget.'));
    }
};
