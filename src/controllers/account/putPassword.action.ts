import { Account, AccountDocument } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const putPassword = async (req: HttpRequest, res: Response, next: NextFunction) => {
    Account.findById(req.user.sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed.', err));
            return;
        }
        account.password = req.body.password;
        account.save((err) => {
            if (err) {
                next(new HttpError(502, 'Account save failed.', err));
                return;
            }
            res.redirect('logout');
        });
    });
};
