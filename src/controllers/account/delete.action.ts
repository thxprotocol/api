import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import '../../config/passport';

/**
 * @swagger
 * /account:
 *   delete:
 *     tags:
 *       - Account
 *     description: Delete current users account
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /login`
 *          headers:
 *             Location:
 *                type: string
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const deleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;

    Account.remove({ _id: account.id }, (err) => {
        if (err) {
            next(new HttpError(502, 'Account remove failed.', err));
            return;
        }
        req.logout();
        res.redirect('login');
    });
};
