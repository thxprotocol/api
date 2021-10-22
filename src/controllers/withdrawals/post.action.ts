import { HttpError, HttpRequest } from '../../models/Error';
import { NextFunction, Response } from 'express';
import WithdrawalService from '../../services/WithdrawalService';

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: Proposes a custom withdrawal for a member of the pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: agree
 *         in: body
 *         required: true
 *         type: boolean
 *     responses:
 *       '201':
 *         description: OK
 *         content:
 *           application/json:  
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID of the withdraw poll
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
export const postWithdrawal = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { withdrawal, error } = await WithdrawalService.proposeWithdrawal(
            req.assetPool,
            req.body.member,
            req.body.amount,
        );

        if (error) throw new Error(error);

        res.status(201).json({ withdrawal });
    } catch (error) {
        next(new HttpError(500, error.toString(), error));
    }
};
