import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import axios from 'axios';
import { ISSUER } from '../../util/secrets';
import { Account } from '../../models/Account';

export const postClient = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const r = await axios({
            method: 'POST',
            url: ISSUER + '/reg',
            data: {
                application_type: 'web',
                client_name: req.body.title,
                grant_types: ['client_credentials'],
                request_uris: [req.body.requestUri],
                redirect_uris: [],
                post_logout_redirect_uris: [],
                response_types: [],
                scope: 'openid admin',
            },
        });
        const rat = r.data.registration_access_token;

        try {
            const account = await Account.findById(req.user.sub);

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
