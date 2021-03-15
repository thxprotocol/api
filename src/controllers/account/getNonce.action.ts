import { Account } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

export const getAccountNonce = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    try {
        const account = await Account.findById(sub);
        const nonce = parseInt(await req.solution.getLatestNonce(account.address)) + 1;

        res.send({
            nonce,
        });
    } catch (e) {
        next(new HttpError(502, 'Account/Nonce READ failed', e));
        return;
    }
};
