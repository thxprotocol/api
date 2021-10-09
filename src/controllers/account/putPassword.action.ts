import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const putPassword = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const account = await AccountService.get(req.user.sub);
        account.password = req.body.password;
        const { error } = await AccountService.patch(account);
        if (error) {
            next(new HttpError(502, 'Account save failed.', error));
            return;
        }
        res.redirect('logout');
    } catch (error) {
        next(new HttpError(502, 'Account find failed.', error));
        return;
    }
};
