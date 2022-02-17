import { HttpError } from '@/models/Error';
import { Request, NextFunction, Response } from 'express';

import WithdrawalService from '@/services/WithdrawalService';

/**
 * @swagger
 * /withdrawals/:id/withdraw:
 *   post:
 *     tags:
 *       - Withdrawals
 *     description: If the poll for this withdrawal is approved the reward will be withdrawn.
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
 *         type: number
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: object
 *               optional: true
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: Base64 string representing function call if governance is disabled.
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
export const postPollFinalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { finalizedWithdrawal } = await WithdrawalService.withdrawPollFinalize(req.assetPool, req.params.id);
        res.json(finalizedWithdrawal);
    } catch (error) {
        next(new HttpError(500, error.message, error));
    }
};
