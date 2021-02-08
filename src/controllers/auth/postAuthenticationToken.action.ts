import crypto from 'crypto';
import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { ORIGIN } from '../../util/secrets';
import { sendMail } from '../../util/mail';

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

            try {
                await sendMail(
                    account.email,
                    'Your one-time login link.',
                    `<p>Hi!</p><p>This is a one-time login link you can use to access the temporary THX wallet setup to hold the assets for account <strong>${account.email}</strong>.</p><p><a href="${ORIGIN}/login?authentication_token=${account.authenticationToken}">${ORIGIN}/login?authentication_token=${account.authenticationToken}</a></p><p><strong>Valid for 10 minutes</strong></p><p>You will be prompted to provide a new password during authentication.</p><p>Sincerly,<br>The THX team.</p>`,
                );
                return res.json({ message: `E-mail sent to ${account.email}` });
            } catch (err) {
                next(new HttpError(502, 'E-mail sent failed.', err));
                return;
            }
        } catch (err) {
            next(new HttpError(500, 'Account save token failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));
        return;
    }
};
