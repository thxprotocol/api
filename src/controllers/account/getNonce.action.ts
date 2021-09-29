import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccountNonce = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    try {
        const account = await AccountService.get(sub);
        const nonce = parseInt(await req.solution.methods.getLatestNonce(account.address).call()) + 1;

        res.send({
            nonce,
        });
    } catch (e) {
        next(new HttpError(502, 'Account/Nonce READ failed', e));
        return;
    }
};
