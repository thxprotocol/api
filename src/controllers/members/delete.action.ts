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
                const { account } = await AccountService.getByAddress(req.params.address);
                const { error } = await AccountService.removeMembership(account.id, req.assetPool);

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
 *         description: Bad Request. Indicates incorrect path parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
