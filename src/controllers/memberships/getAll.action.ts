import { Request, Response } from 'express';

import MembershipService from '@/services/MembershipService';

export const getMemberships = async (req: Request, res: Response) => {
    const memberships = await MembershipService.get(req.user.sub);

    res.json(memberships);
};

/**
 * @swagger
 * /membership:
 *   get:
 *     tags:
 *       - Membership
 *     description: Provides a list of all membership based on sub.
 *     produces:
 *       - application/json
 *     responses:
 *        '200':
 *          description: OK
 *          content: application/json
 *          schema:
 *                type: array
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
