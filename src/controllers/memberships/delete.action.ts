import { Request, NextFunction, Response } from 'express';
import { HttpError } from '@/models/Error';
import MembershipService from '@/services/MembershipService';

export const deleteMembership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { error } = await MembershipService.remove(req.params.id);

        if (error) throw new Error(error);

        res.status(204).end();
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
    }
};

/**
 * @swagger
 * /membership/:id:
 *   delete:
 *     tags:
 *       - Members
 *     description: Revokes a membership from the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       '204':
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
