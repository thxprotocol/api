import { Account, AccountDocument } from '@/models/Account';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '@/models/Error';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    try {
        const account: AccountDocument = await Account.findById(sub);

        if (account) {
            res.send({
                address: account.address,
                erc20: account.erc20,
                privateKey: account.privateKey,
                memberships: account.memberships,
                burnProofs: account.burnProofs,
                registrationAccessTokens: account.registrationAccessTokens,
            });
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};
