import { Account, AccountDocument } from '../../models/Account';
import { Request, Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

/**
 * @swagger
 * /account:
 *   get:
 *     tags:
 *       - Account
 *     description: Get profile information for your account
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *          type: object
 *          properties:
 *              burnProofs:
 *                  type: array
 *                  items:
 *                      type: string
 *                      description: Burnproof transaction hash
 *              assetPools:
 *                  type: array
 *                  items:
 *                      type: string
 *                      description: Asset pool address
 *              address:
 *                  type: string
 *                  description: Current wallet address for the logged in user.
 *              privateKey:
 *                  type: string
 *                  description: If no wallet address is provided during signup this field will contain a password encrypted base64 string for the private key of the random wallet address.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    Account.findById(sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, 'Account find failed', err));
            return;
        }
        if (account) {
            res.send({
                address: account.address,
                privateKey: account.privateKey,
                burnProofs: account.profile.burnProofs,
                assetPools: account.profile.assetPools,
            });
        }
    });
};
