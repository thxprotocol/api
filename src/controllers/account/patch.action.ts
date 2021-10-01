import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import AccountService from '../../services/AccountService';

export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await AccountService.patchUserAccount(req);

        if (error) {
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
