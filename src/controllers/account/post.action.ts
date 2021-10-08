import { Response, NextFunction } from 'express';
import { createRandomToken } from '../../util/tokens';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

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
        const existingUser = await AccountService.getByEmail(req.body.email);
        if (existingUser) {
            return next(new HttpError(422, 'A user for this e-mail already exists.'));
        }
        try {
            const { error } = await AccountService.post(
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                req.body.password,
                signupToken,
                signupTokenExpires,
            );
            if (error) throw new Error(error);
            res.status(201).end();
        } catch (e) {
            return next(new HttpError(502, 'Could not save the account.', e));
        }
    } catch (e) {
        return next(new HttpError(500, 'Could not create random token.', e));
    }
};
