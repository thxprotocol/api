import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const putPassword = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await AccountService.putUserPassword(req);
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
