import { Account, AccountDocument } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    Account.findById(sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed', err));
            return;
        }
        if (account) {
            res.send({
                address: account.address,
                privateKey: account.privateKey,
                memberships: account.memberships,
                burnProofs: account.burnProofs,
            });
        }
    });
};
