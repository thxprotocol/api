import { Account } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import '../../config/passport';

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Create an account using email and password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: address
 *         in: body
 *         required: false
 *         type: string
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
 *       '302':
 *          description: Redirect. Redirects to `GET /account`
 *          headers:
 *             Location:
 *                schema:
 *                  type: string
 *       '400':
 *         description: Bad Request. Indicated incorrect body parameters.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    let address = '',
        privateKey = '';

    if (req.body.address) {
        address = req.body.address;
    } else {
        const wallet = ethers.Wallet.createRandom();

        privateKey = wallet.privateKey;
        address = await wallet.getAddress();
    }

    const account = new Account({
        address,
        privateKey,
        email: req.body.email,
        password: req.body.password,
    });

    try {
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            next(new HttpError(422, 'A user for this e-mail already exists.'));
            return;
        }

        account.save((error) => {
            if (error) {
                next(new HttpError(502, 'Account save failed.', error));
                return;
            }

            req.logIn(account, (error) => {
                if (error) {
                    next(new HttpError(502, 'Account login failed', error));
                    return;
                }

                res.status(201).redirect(`/${VERSION}/account`);
            });
        });
    } catch (err) {
        next(new HttpError(500, 'Account signup failed.', err));
        return;
    }
};
