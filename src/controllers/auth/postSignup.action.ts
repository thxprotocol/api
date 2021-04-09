import { Account } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { HttpError, HttpRequest } from '../../models/Error';

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
export const postSignup = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = await wallet.getAddress();
    const account = new Account({
        address,
        privateKey,
        email: req.body.email,
        password: req.body.password,
        memberships: req.solution ? [req.solution.address] : [],
    });

    try {
        if (req.solution && (await req.solution.isMember(address))) {
            await (await req.solution.addMember(address)).wait();
        }
    } catch (err) {
        return next(new HttpError(502, 'Asset Pool addMember failed.', err));
    }

    try {
        const existingUser = await Account.findOne({ email: req.body.email });

        if (existingUser) {
            return next(new HttpError(422, 'A user for this e-mail already exists.'));
        }

        try {
            await account.save();
            res.status(201).json({ address });
        } catch (e) {
            next(new HttpError(502, 'Account save failed.', e));
            return;
        }
    } catch (err) {
        next(new HttpError(500, 'Account signup failed.', err));
    }
};
