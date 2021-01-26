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
 *       - name: address
 *         in: body
 *         required: false
 *         type: string
 *       - name: firstName
 *         in: body
 *         required: false
 *         type: string
 *       - name: lastName
 *         in: body
 *         required: false
 *         type: string
 *       - name: gender
 *         in: body
 *         required: false
 *         type: string
 *       - name: location
 *         in: body
 *         required: false
 *         type: string
 *       - name: picture
 *         in: body
 *         required: false
 *         type: string
 *       - name: burnProofs
 *         in: body
 *         required: false
 *         type: array
 *         items:
 *          type: string
 *       - name: assetPools
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
        if (req.body.address && ethers.utils.isAddress(req.body.address)) {
            account.address = req.body.address;
            account.privateKey = '';
        }
        account.privateKey = req.body.privateKey || account.privateKey;
        account.profile.burnProofs = req.body.burnProofs || account.profile.burnProofs;
        account.profile.assetPools = req.body.assetPools || account.profile.assetPools;
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
