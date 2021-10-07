import { Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { HttpError, HttpRequest } from '../../models/Error';
import { OAUTH_CLIENT_SECRET, OAUTH_CLIENT_ID, OAUTH_REDIRECT_URIS } from '../../util/secrets';

export const googleCallback = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const code = req.query.code as string;
        console.log('Auth Code ' + code);
        const oAuth2Client = new OAuth2Client(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URIS);
        oAuth2Client.getToken(code, async (err, token) => {
            try {
                oAuth2Client.setCredentials(token);
                const url = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';
                const res = await oAuth2Client.request({ url });
                console.log(res.data);
            } catch (err) {
                return next(err);
            }
        });
    } catch (e) {
        next(new HttpError(502, 'Failed to authenticate', e));
    }
};
