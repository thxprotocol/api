import { NextFunction, Response } from 'express';
import { Withdrawal, WithdrawalDocument } from '../../models/Withdrawal';
import { HttpError, HttpRequest } from '../../models/Error';
import WithdrawalService from '../../services/WithdrawalService';
/**
 * @swagger
 * /withdrawals?member=:address:
 *   get:
 *     tags:
 *       - Withdrawals
 *     description: Get a list of withdrawals for a member of the asset pool.
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
        const { withdrawals, error } = await WithdrawalService.getWithdrawals(
            req.solution.options.address,
            req.query.member as string,
            req.query.rewardId ? Number(req.query.rewardId) : undefined,
            req.query.state ? Number(req.query.state) : 0,
        );
        if (error) throw new Error(error);
        res.json(
            withdrawals.map((w: WithdrawalDocument) => {
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
        );
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
