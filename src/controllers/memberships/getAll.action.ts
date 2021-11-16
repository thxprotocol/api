import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MembershipService from '../../services/MembershipService';

export const getMemberships = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { membership, error } = await MembershipService.get(req.user.sub);

        if (error) throw new Error(error);

        res.json(membership);
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
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
