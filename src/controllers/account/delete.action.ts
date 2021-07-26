import { Account } from '@/models/Account';
import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '@/models/Error';

export const deleteAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        await Account.remove({ _id: req.user.sub });

        res.status(204).end();
    } catch (e) {
        next(new HttpError(502, 'Account remove failed.', e));
    }
};
