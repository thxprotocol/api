import { NextFunction, Response } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import WithdrawalService from '../../services/WithdrawalService';

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
 *         schema:
 *            type: object
 *            properties:
 *              id:
 *                  type: string
 *                  description: ID of the withdrawal.
 *              beneficiary:
 *                  type: string
 *                  description: Beneficiary of the reward.
 *              amount:
 *                  type: string
 *                  description: Rewarded amount for the beneficiary
 *              approved:
 *                  type: string
 *                  description: Boolean reflecting the approved state of the withdrawal.
 *              state:
 *                  type: number
 *                  description: WithdrawState [Pending, Withdrawn]
 *              poll:
 *                  type: object
 *                  properties:
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
export const getWithdrawal = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { withdrawal } = await WithdrawalService.get(req.solution.options.address, Number(req.params.id));

        if (!withdrawal) {
            return next(new HttpError(404, 'Could not find a withdrawal for this ID.'));
        }

        res.json({
            id: withdrawal.id,
            beneficiary: withdrawal.beneficiary,
            amount: withdrawal.amount,
            approved: withdrawal.approved,
            state: withdrawal.state,
            poll: {
                startTime: withdrawal.poll.startTime,
                endTime: withdrawal.poll.endTime,
                yesCounter: withdrawal.poll.yesCounter,
                noCounter: withdrawal.poll.noCounter,
                totalVoted: withdrawal.poll.totalVoted,
            },
        });
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
