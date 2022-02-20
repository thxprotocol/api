import { Request, NextFunction, Response } from 'express';
import { HttpError } from '@/models/Error';
import MemberService, { ERROR_IS_NOT_MEMBER } from '@/services/MemberService';
import AccountProxy from '@/proxies/AccountProxy';
import MembershipService from '@/services/MembershipService';

export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
    const isMember = await MemberService.isMember(req.assetPool, req.params.address);

    if (!isMember) {
        return next(new HttpError(404, ERROR_IS_NOT_MEMBER));
    } else {
        await MemberService.removeMember(req.assetPool, req.params.address);

        const account = await AccountProxy.getByAddress(req.params.address);
        await MembershipService.removeMembership(account.id, req.assetPool);

        res.status(204).end();
    }
};

/**
 * @swagger
 * /members/:address:
 *   delete:
 *     tags:
 *       - Members
 *     description: Revokes a membership from the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
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
