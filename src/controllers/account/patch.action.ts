import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import AccountService from '../../services/AccountService';

export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const account = await AccountService.get(req.user.sub);

        account.address = req.body.address || account.address;
        account.memberships = req.body.memberships || account.memberships;
        account.privateKeys = req.body.privateKeys || account.privateKeys;
        account.burnProofs = req.body.burnProofs || account.burnProofs;

        account.save((err: any) => {
            if (err) {
                if (err.code === 11000) {
                    next(new HttpError(422, 'A user for this e-mail already exists.', err));
                    return;
                }
                next(new HttpError(502, 'Account save failed', err));
                return;
            }
            res.redirect(303, `/${VERSION}/account`);
        });
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));
        return;
    }
};
