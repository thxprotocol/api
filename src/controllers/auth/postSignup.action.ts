import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MemberService from '../../services/MemberService';
import AccountService from '../../services/AccountService';

const ERROR_DUPLICATE_EMAIL = 'An account with this e-mail address already exists.';

export const postSignup = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await AccountService.isEmailDuplicate(req.body.email);

        if (result) {
            throw new Error(ERROR_DUPLICATE_EMAIL);
        }

        if (error) {
            throw new Error(error);
        }

        const account = AccountService.signupFor(
            req.body.email,
            req.body.password,
            req.body.address,
            req.assetPool?.address,
        );

        await account.save();

        if (req.assetPool) {
            const { error } = await MemberService.addMember(req.assetPool, account.address);

            if (error) {
                throw new Error(error);
            } else {
                const { error } = await AccountService.addMembershipForAddress(req.assetPool, account.address);

                if (error) {
                    throw new Error(error);
                }
            }
        }

        res.status(201).json({ address: account.address });
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
};

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
