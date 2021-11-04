import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MemberService from '../../services/MemberService';
import AccountService from '../../services/AccountService';

const ERROR_DUPLICATE_EMAIL = 'An account with this e-mail address already exists.';
const ERROR_CREATE_ACCOUNT = 'Could not signup for an account';

export const postAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function checkDuplicateEmail() {
        const { isDuplicate } = await AccountService.isEmailDuplicate(req.body.email);

        if (isDuplicate) {
            throw new Error(ERROR_DUPLICATE_EMAIL);
        }
    }

    async function createAccount() {
        const { account, error } = await AccountService.signupFor(
            req.body.email,
            req.body.password,
            req.body.address,
            req.assetPool?.address,
        );

        if (error) throw new Error(ERROR_CREATE_ACCOUNT);

        return account;
    }

    async function addMember(account: any) {
        const { error } = await MemberService.addMember(req.assetPool, account.address);

        if (error) {
            throw new Error(error);
        }
    }

    async function addMembership(account: any) {
        const { error } = await AccountService.addMembership(account.id, req.assetPool);

        if (error) {
            throw new Error(error);
        }
    }

    try {
        await checkDuplicateEmail();

        const account = await createAccount();

        if (req.assetPool) {
            await addMember(account);
            await addMembership(account);
        }

        res.status(201).json({ id: account.id, address: account.address });
    } catch (error) {
        return next(new HttpError(502, error.message, error));
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
