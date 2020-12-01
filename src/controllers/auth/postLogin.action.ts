import passport from 'passport';
import { AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import '../../config/passport';

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Sign in using email and password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect. Redirects to `GET /account`
 *          headers:
 *             Location:
 *                schema:
 *                  type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (error: Error, account: AccountDocument) => {
        if (error) {
            next(new HttpError(502, 'Account authenticate failed.', error));
            return;
        }
        req.logIn(account, (error) => {
            if (error) {
                next(new HttpError(502, 'Account login failed', error));
                return;
            }
            res.redirect(`/${VERSION}/account`);
        });
    })(req, res, next);
};
