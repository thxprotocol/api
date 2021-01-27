import crypto from 'crypto';
import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { ORIGIN } from '../../util/secrets';

function createRandomToken() {
    const buf = crypto.randomBytes(16);
    return buf.toString('hex');
}

/**
 * @swagger
 * /authentication_token:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Returns a one-time login link for the wallet. Valid for 10 minutes.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               url:
 *                  type: string
 *                  description: One-time login link for wallet.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Password reset token is invalid or has expired.
 *       '404':
 *         description: Not Found. Account does not exist.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postAuthenticationToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const account: AccountDocument = await Account.findOne({ email: req.body.email });

        if (!account) {
            next(new HttpError(404, 'Account does not exist.'));
            return;
        }

        const { error, isMatch } = account.comparePassword(req.body.password);

        if (error) {
            next(new HttpError(500, 'Password comparison failed'));
            return;
        }

        if (!isMatch) {
            next(new HttpError(500, 'Password is incorrect'));
            return;
        }

        try {
            const authenticationToken = createRandomToken();

            account.authenticationToken = authenticationToken;
            account.authenticationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            await account.save();

            res.json({ url: `${ORIGIN}/login?authentication_token=${account.authenticationToken}` });
        } catch (err) {
            next(new HttpError(500, 'Account save token failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));

        return;
    }
};
