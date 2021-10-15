import { Response, NextFunction } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const deleteAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await AccountService.remove(req.user.sub);

        if (error) throw new Error(error);

        res.status(204).end();
    } catch (e) {
        next(new HttpError(502, 'Account remove failed.', e));
    }
};
