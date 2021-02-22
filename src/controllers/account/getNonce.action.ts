import { Account } from '../../models/Account';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

/**
 * @swagger
 * /account:
 *   get:
 *     tags:
 *       - Account
 *     description: Get latest nonce for this account
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *          type: object
 *          properties:
 *              nonce:
 *                  type: number
 *                  description: Current nonce for this address
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this asset pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getAccountNonce = async (req: HttpRequest, res: Response, next: NextFunction) => {
    const sub = req.user.sub;

    try {
        const account = await Account.findById(sub);
        const nonce = parseInt(await req.solution.getLatestNonce(account.address)) + 1;

        res.send({
            nonce,
        });
    } catch (e) {
        next(new HttpError(502, 'Account/Nonce READ failed', e));
        return;
    }
};
