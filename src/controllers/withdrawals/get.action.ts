import { Request, Response } from 'express';

import WithdrawalService from '@/services/WithdrawalService';
import { NotFoundError } from '@/util/errors';
import { TWithdrawal } from '@/types/TWithdrawal';

/**
 * @swagger
 * /withdrawals/:id:
 *   get:
 *     tags:
 *       - Withdrawals
 *     description: Get information about a withdrawal
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
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID of the withdrawal.
 *                 beneficiary:
 *                   type: string
 *                   description: Beneficiary of the reward.
 *                 amount:
 *                   type: string
 *                   description: Rewarded amount for the beneficiary
 *                 approved:
 *                   type: string
 *                   description: Boolean reflecting the approved state of the withdrawal.
 *                 state:
 *                   type: number
 *                   description: WithdrawState [Pending, Withdrawn]
 *                 poll:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                        type: number
 *                        description: Timestamp for the start time of the poll.
 *                     endTime:
 *                        type: number
 *                        description: Timestamp for the end time of the poll.
 *                     yesCounter:
 *                        type: number
 *                        description: Amount of yes votes for the poll.
 *                     noCounter:
 *                        type: number
 *                        description: Amount of no votes for the poll.
 *                     totalVoted:
 *                        type: number
 *                        description: Total amount of votes for the poll.
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
export const getWithdrawal = async (req: Request, res: Response) => {
    const withdrawal = await WithdrawalService.getById(req.params.id);
    if (!withdrawal) throw new NotFoundError();

    const result: TWithdrawal = {
        id: String(withdrawal._id),
        type: withdrawal.type, 
        sub: withdrawal.sub,
        beneficiary: withdrawal.beneficiary,
        unlockDate: withdrawal.unlockDate,
        poolAddress: req.assetPool.address,
        withdrawalId: withdrawal.withdrawalId,
        state: withdrawal.state,
        failReason: withdrawal.failReason,
        amount: withdrawal.amount,
        transactions: withdrawal.transactions,
        createdAt: withdrawal.createdAt,
    };

    res.json(result);
};
