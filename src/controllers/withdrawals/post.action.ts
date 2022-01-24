import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import WithdrawalService from '../../services/WithdrawalService';
import JobService from '../../services/JobService';
import '../../jobs/proposeWithdraw';

export const postWithdrawal = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const withdrawal = await WithdrawalService.schedule(req.assetPool, req.body.member, req.body.amount);
        const id = withdrawal._id.toString();
        const job = await JobService.proposeWithdraw(req.assetPool, id, req.body.member, req.body.amount);

        withdrawal.jobId = job.attrs._id.toString();
        await withdrawal.save();

        res.status(201).json(withdrawal);
    } catch (error) {
        next(new HttpError(500, error.toString(), error));
    }
};

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
 *       - name: assetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       '201':
 *         description: OK
 *         content: application/json
 *         schema:
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
