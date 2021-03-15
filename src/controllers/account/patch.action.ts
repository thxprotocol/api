import { Account, AccountDocument } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { Error } from 'mongoose';

export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    Account.findById(req.user.sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed.', err));
            return;
        }

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
    });
};
