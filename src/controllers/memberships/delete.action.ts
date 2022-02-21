import { Request, Response } from 'express';
import MembershipService from '@/services/MembershipService';

export const deleteMembership = async (req: Request, res: Response) => {
    await MembershipService.remove(req.params.id);

    res.status(204).end();
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
