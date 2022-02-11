import MemberService from '../../services/MemberService';
import MembershipService from '../../services/MembershipService';
import AccountProxy from '../../proxies/AccountProxy';
import { Request, NextFunction, Response } from 'express';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';

export async function postMember(req: Request, res: Response, next: NextFunction) {
    try {
        const { account, error } = await AccountProxy.getByAddress(req.body.address);

        if (error) {
            throw error;
        } else {
            const { error } = await MemberService.addMember(req.assetPool, req.body.address);

            if (error) {
                throw new Error(error);
            } else {
                const { error } = await MembershipService.addMembership(account.id, req.assetPool);

                if (error) {
                    throw new Error(error);
                } else {
                    res.redirect(`/${VERSION}/members/${account.address}`);
                }
            }
        }
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
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
 *         description: Redirect. GET /members/:address.
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
