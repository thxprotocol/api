import { Request, Response } from 'express';

import MembershipService from '@/services/MembershipService';
import WithdrawalService from '@/services/WithdrawalService';
import AccountProxy from '@/proxies/AccountProxy';
import { NotFoundError } from '@/util/errors';

export const getMembership = async (req: Request, res: Response) => {
    const membership = await MembershipService.getById(req.params.id);
    if (!membership) throw new NotFoundError();

    const account = await AccountProxy.getById(req.user.sub);
    if (!account) throw new NotFoundError('No Account');

    const pending = await WithdrawalService.getPendingBalance(account, membership.poolAddress);

    res.json({ ...membership, pendingBalance: pending });
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
