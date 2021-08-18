import axios from 'axios';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { ISSUER } from '../../util/secrets';
import { Widget } from '../../models/Widget';

export const postWidget = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const r = await axios({
            method: 'POST',
            url: ISSUER + '/reg',
            data: {
                application_type: 'web',
                grant_types: ['authorization_code'],
                request_uris: req.body.requestUris,
                redirect_uris: req.body.redirectUris,
                post_logout_redirect_uris: req.body.postLogoutRedirectUris,
                response_types: ['code'],
                scope: 'openid user widget',
            },
        });

        const rat = r.data.registration_access_token;
        const widget = new Widget({
            sub: req.user.sub,
            rat,
            metadata: {
                rewardId: req.body.metadata.rewardId,
            },
        });

        await widget.save();

        res.status(201).json(widget);
    } catch (e) {
        return next(new HttpError(502, 'Could not register your widget.'));
    }
};
