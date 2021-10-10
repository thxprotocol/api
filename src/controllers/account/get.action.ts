import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    try {
        const account = await AccountService.get(sub);

        if (account) {
            res.send({
                address: account.address,
                erc20: account.erc20,
                privateKey: account.privateKey,
                memberships: account.memberships,
                burnProofs: account.burnProofs,
                registrationAccessTokens: account.registrationAccessTokens,
                account,
            });
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};
