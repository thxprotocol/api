import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { IAssetPool } from '../../models/AssetPool';
import { WithdrawalType } from '../../models/Withdrawal';

import WithdrawalService from '../../services/WithdrawalService';
import { agenda, eventNameProcessWithdrawals } from '../../util/agenda';

export async function jobProposeWithdraw(assetPool: IAssetPool, id: string, amount: number, beneficiary: string) {
    await WithdrawalService.proposeWithdraw(assetPool, id, beneficiary, amount);
}

export const postWithdrawal = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const withdrawal = await WithdrawalService.schedule(
            req.assetPool,
            WithdrawalType.ProposeWithdraw,
            req.body.member,
            req.body.amount,
        );

        res.status(201).json({
            id: withdrawal.id,
            type: withdrawal.type,
            withdrawalId: withdrawal.withdrawalId,
            rewardId: withdrawal.rewardId,
            beneficiary: withdrawal.beneficiary,
            amount: withdrawal.amount,
            approved: withdrawal.approved,
            state: withdrawal.state,
            poll: withdrawal.poll,
            createdAt: withdrawal.createdAt,
            updatedAt: withdrawal.updatedAt,
        });
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
