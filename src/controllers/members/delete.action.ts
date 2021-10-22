import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MemberService, { ERROR_IS_NOT_MEMBER } from '../../services/MemberService';
import AccountService from '../../services/AccountService';

export const deleteMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { isMember, error } = await MemberService.isMember(req.assetPool, req.params.address);

        if (error) throw new Error(error);

        if (!isMember) {
            return next(new HttpError(404, ERROR_IS_NOT_MEMBER));
        } else {
            const { error } = await MemberService.removeMember(req.assetPool, req.params.address);

            if (error) {
                throw new Error(error);
            } else {
                const { error } = await AccountService.removeMembershipForAddress(req.assetPool, req.params.address);

                if (error) throw new Error(error);

                res.status(204).end();
            }
        }
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
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
