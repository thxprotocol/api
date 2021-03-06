import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { WALLET_URL, SECURE_KEY } from '../../util/secrets';
import { sendMail } from '../../util/mail';
import { encryptString } from '../../util/encrypt';
import { createRandomToken } from '../../util/tokens';

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

        try {
            const secureKey = encryptString(req.body.password, SECURE_KEY.split(',')[0]);

            account.authenticationToken = encryptString(createRandomToken(), req.body.password);
            account.authenticationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            await account.save();

            try {
                await sendMail(
                    account.email,
                    'Get access to your THX wallet!',
                    `
                    <p style="font-size: 14px; color: black;">Hi!</p>
                    <p style="font-size: 14px; color: black;">This link you can use to access the temporary THX wallet setup to hold the assets for account <strong>${account.email}</strong>.</p>
                    <p></p>
                    <p style="font-size: 14px; color: black;">
                        <a style="display: inline-block; text-decoration: none; background-color: #ffe500; border: 1px solid #ffe500; padding: .7rem 1rem; font-size: 14px; border-radius: 3px; color: black; line-height: 1;" 
                        href="${WALLET_URL}/login?authentication_token=${account.authenticationToken}&secure_key=${secureKey}">
                        Access your assets!
                        </a>
                    </p>
                    <p style="font-size: 12px; color: black;">Or copy this link (valid for 10 minutes):<br>
                        <code>${WALLET_URL}/login?authentication_token=${account.authenticationToken}&secure_key=${secureKey}</code>
                    </p>
                    `,
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
