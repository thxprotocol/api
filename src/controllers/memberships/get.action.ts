import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

import MembershipService from '../../services/MembershipService';
import WithdrawalService from '../../services/WithdrawalService';
import AccountProxy from '../../proxies/AccountProxy';

export const getMembership = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { membership } = await MembershipService.getById(req.params.id);
        const { account } = await AccountProxy.getById(req.user.sub);
        const { pending } = await WithdrawalService.getPendingBalance(account, membership.poolAddress);

        res.json({ ...membership, pendingBalance: pending });
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
};

/**
 * @swagger
 * /membership/:id:
 *   get:
 *     tags:
 *       - Membership
 *     description: Retrieves membershi based on id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *        '200':
 *          description: OK
 *          content: application/json
 *          schema:
 *                items:
 *                  type: object
 *                  properties:
 *                    sub:
 *                      type: string
 *                    network:
 *                      type: number
 *                    poolAddress:
 *                      type: string
 *                    tokenAddress:
 *                      type: string
 *        '400':
 *           $ref: '#/components/responses/400'
 *        '401':
 *           $ref: '#/components/responses/401'
 *        '403':
 *           description: Forbidden. Your account does not have access to this information.
 *        '404':
 *           description: Not Found.
 *        '500':
 *           $ref: '#/components/responses/500'
 *        '502':
 *           $ref: '#/components/responses/502'
 */
