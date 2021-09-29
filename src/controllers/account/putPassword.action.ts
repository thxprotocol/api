import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const putPassword = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const account = await AccountService.get(req.user.sub);
        account.password = req.body.password;
        account.save((err) => {
            if (err) {
                next(new HttpError(502, 'Account save failed.', err));
                return;
            }
            res.redirect('logout');
        });
    }
    catch(error) {
        next(new HttpError(502, 'Account find failed.', error));
        return;
    } 
};
