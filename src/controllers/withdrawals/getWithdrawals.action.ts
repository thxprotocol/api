import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';

import WithdrawalService from '../../services/WithdrawalService';
import JobService from '../../services/JobService';

export const getWithdrawals = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const withdrawals = [];
        const { result, error } = await WithdrawalService.getAll(
            req.solution.options.address,
            Number(req.query.page),
            Number(req.query.limit),
            req.query.member && req.query.member.length > 0 ? String(req.query.member) : undefined,
            !isNaN(Number(req.query.rewardId)) ? Number(req.query.rewardId) : undefined,
            !isNaN(Number(req.query.state)) ? Number(req.query.state) : undefined,
        );

        if (error) throw new Error(error);

        for (const w of result.results) {
            const job = await JobService.getJob(w.jobId);

            withdrawals.push({
                id: w.id,
                job,
                withdrawalId: w.withdrawalId,
                rewardId: w.rewardId,
                beneficiary: w.beneficiary,
                amount: w.amount,
                approved: w.approved,
                state: w.state,
                poll: w.poll,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt,
            });
        }
        result.results = withdrawals;
        res.json(result);
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};

/**
 * @swagger
 * /withdrawals?member=:address&state=:state&rewardId=:rewardId&page=1&limit=20:
 *   get:
 *     tags:
 *       - Withdrawals
 *     description: Get a list of withdrawals for a member of the asset pool. Optional `member` parameter should be a string representing the address. Optional `:state` parameter should be a number where 0 = Rejected, 1 = Approved, 2 = Withdrawn. Optional `rewardId` parameter should be a number representing the reward this withdrawal was created for.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                  id:
 *                    type: string
 *                    description: ID of the withdrawal.
 *                  beneficiary:
 *                    type: string
 *                    description: Beneficiary of the reward.
 *                  amount:
 *                    type: string
 *                    description: Rewarded amount for the beneficiary
 *                  approved:
 *                    type: string
 *                    description: Boolean reflecting the approved state of the withdrawal.
 *                  state:
 *                    type: number
 *                    description: WithdrawState [Pending, Withdrawn]
 *                  poll:
 *                    type: object
 *                    properties:
 *                       startTime:
 *                          type: number
 *                          description: Timestamp for the start time of the poll.
 *                       endTime:
 *                          type: number
 *                          description: Timestamp for the end time of the poll.
 *                       yesCounter:
 *                          type: number
 *                          description: Amount of yes votes for the poll.
 *                       noCounter:
 *                          type: number
 *                          description: Amount of no votes for the poll.
 *                       totalVoted:
 *                          type: number
 *                          description: Total amount of votes for the poll.
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
