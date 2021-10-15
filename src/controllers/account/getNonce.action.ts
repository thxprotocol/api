import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccountNonce = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const account = await AccountService.get(req.user.sub);
        const nonce = parseInt(await req.solution.methods.getLatestNonce(account.address).call()) + 1;

        res.send({
            nonce,
        });
    } catch (e) {
        next(new HttpError(502, 'Account/Nonce READ failed', e));
        return;
    }
};
