import { Account, AccountDocument } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { HttpError, HttpRequest } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import { Error } from 'mongoose';

/**
 * @swagger
 * /account:
 *   patch:
 *     tags:
 *       - Account
 *     description: Create profile information for your account.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: burnProofs
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *       - name: memberships
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *       - name: privateKeys
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /account`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect rewardPollDuration or proposeWithdrawPollDuration values.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 *
 */
export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    Account.findById(req.user.sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed.', err));
            return;
        }

        account.memberships = req.body.assetPools || account.memberships;
        account.privateKeys = req.body.privateKeys || account.privateKeys;
        account.burnProofs = req.body.burnProofs || account.burnProofs;

        account.save((err: any) => {
            if (err) {
                if (err.code === 11000) {
                    next(new HttpError(422, 'A user for this e-mail already exists.', err));
                    return;
                }
                next(new HttpError(502, 'Account save failed', err));
                return;
            }
            res.redirect(303, `/${VERSION}/account`);
        });
    });
};
