import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.getById(req.user.sub);

        if (error) throw new Error(error.message);

        if (account) {
            res.send({
                address: account.address,
                privateKey: account.privateKey,
                erc20: account.erc20,
                memberships: account.memberships,
                clients: account.clients,
            });
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};
