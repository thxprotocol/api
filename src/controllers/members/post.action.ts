import MemberService from '../../services/MemberService';
import AccountService from '../../services/AccountService';
import { NextFunction, Response } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

export async function postMember(req: HttpRequest, res: Response, next: NextFunction) {
    try {
        const r = await MemberService.addMember(req.assetPool, req.body.address);

        if (r && r.error) {
            return next(new HttpError(502, r.error.toString(), r.error));
        }

        try {
            const r = await AccountService.addMembershipForAddress(req.assetPool, req.body.address);

            if (r && r.error) {
                return next(new HttpError(500, r.error.toString(), r.error));
            }

            return res.redirect(`/${VERSION}/members/${req.body.address}`);
        } catch (e) {
            return next(new HttpError(502, e.toString(), e));
        }
    } catch (e) {
        return next(new HttpError(502, e.toString(), e));
    }
}

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Adds a membership to the asset pool and updates the account with the address.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect. GET /members/:address.
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
