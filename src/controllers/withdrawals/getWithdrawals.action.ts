import { NextFunction, Response } from 'express';
import { WithdrawalDocument } from '../../models/Withdrawal';
import { HttpError, HttpRequest } from '../../models/Error';
import WithdrawalService from '../../services/WithdrawalService';
/**
 * @swagger
 * /withdrawals?member=:address&state=:state&rewardId=:rewardId:
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
 *         schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                    type: string
 *                    description: ID of the withdrawal.
 *                beneficiary:
 *                    type: string
 *                    description: Beneficiary of the reward.
 *                amount:
 *                    type: string
 *                    description: Rewarded amount for the beneficiary
 *                approved:
 *                    type: string
 *                    description: Boolean reflecting the approved state of the withdrawal.
 *                state:
 *                    type: number
 *                    description: WithdrawState [Pending, Withdrawn]
 *                poll:
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
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawals = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { results, error } = await WithdrawalService.getWithdrawals(
            req.solution.options.address,
            Number(req.query.page),
            Number(req.query.limit),
            req.query.member && req.query.member.length > 0 ? String(req.query.member) : undefined,
            !isNaN(Number(req.query.rewardId)) ? Number(req.query.rewardId) : undefined,
            !isNaN(Number(req.query.state)) ? Number(req.query.state) : undefined,
        );
        if (error) throw new Error(error);

        res.json({
            results: results.results.map((w: WithdrawalDocument) => {
                return {
                    id: w.id,
                    beneficiary: w.beneficiary,
                    amount: w.amount,
                    approved: w.approved,
                    state: w.state,
                    rewardId: w.rewardId,
                    poll: {
                        startTime: w.poll.startTime,
                        endTime: w.poll.endTime,
                        yesCounter: w.poll.yesCounter,
                        noCounter: w.poll.noCounter,
                        totalVoted: w.poll.totalVoted,
                    },
                };
            }),
            next: results.next,
            previous: results.previous,
        });
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
