import { Account } from '@/models/Account';
import { Response, NextFunction } from 'express';
import { createRandomToken } from '@/util/tokens';
import { HttpError, HttpRequest } from '@/models/Error';

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Creates an account using email and password.
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
 *       - name: confirmPassword
 *         description: Password to use for confirmation.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '201':
 *         description: Created
 *         schema:
 *             type: object
 *             properties:
 *                address:
 *                   type: string
 *                   description: The address for the new account.
 *       '400':
 *         description: Bad Request. Indicated incorrect body parameters.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const signupToken = createRandomToken();
        const signupTokenExpires = Date.now() + 86400000; // 24 hours
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            return next(new HttpError(422, 'A user for this e-mail already exists.'));
        }

        try {
            const account = new Account({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                signupToken,
                signupTokenExpires,
            });

            await account.save();

            res.status(201).end();
        } catch (e) {
            return next(new HttpError(502, 'Could not save the account.', e));
        }
    } catch (e) {
        return next(new HttpError(500, 'Could not create random token.', e));
    }
};
