import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import AccountProxy from '../../proxies/AccountProxy';

export const patchAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await AccountProxy.update(req.user.sub, {
            address: req.body.address,
            googleAccess: req.body.googleAccess,
            twitterAccess: req.body.twitterAccess,
            spotifyAccess: req.body.spotifyAccess,
        });

        if (!result || error) {
            if (error.code === 11000) {
                next(new HttpError(422, 'A user for this e-mail already exists.', error));
                return;
            }
            next(new HttpError(502, 'Account save failed', error));
            return;
        }
        res.redirect(303, `/${VERSION}/account`);
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));
        return;
    }
};
