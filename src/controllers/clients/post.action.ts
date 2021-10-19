import axios from 'axios';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { AUTH_URL } from '../../util/secrets';
import AccountService from '../../services/AccountService';

export const postClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const r = await axios({
            method: 'POST',
            url: AUTH_URL + '/reg',
            data: {
                application_type: 'web',
                grant_types: ['authorization_code'],
                request_uris: req.body.request_uris,
                redirect_uris: req.body.request_uris,
                post_logout_redirect_uris: req.body.request_uris,
                response_types: ['code'],
                scope: 'openid user widget',
            },
        });

        const rat = r.data.registration_access_token;

        try {
            const { account } = await AccountService.get(req.user.sub);

            if (account.registrationAccessTokens.length > 0) {
                account.registrationAccessTokens.push(rat);
            } else {
                account.registrationAccessTokens = [rat];
            }

            await account.save();

            res.status(201).json({
                rat,
            });
        } catch (e) {
            return next(new HttpError(502, 'Could not store registration access token.'));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not registration your application.'));
    }
};
