import { NextFunction, Response } from 'express';
import { Withdrawal, WithdrawalDocument } from '../../models/Withdrawal';
import { HttpError, HttpRequest } from '../../models/Error';

/**
 * @swagger
 * /withdrawals?member=:address:
 *   get:
 *     tags:
 *       - Withdrawals
 *     description: Get a list of withdrawals for the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *          description: OK
 *          schema:
 *              withdrawPolls:
 *                  type: array
 *                  items:
 *                      type: string
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawals = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const withdrawals = await Withdrawal.find({
            beneficiary: req.query.member as string,
            poolAddress: req.solution.address,
        });

        res.json(
            withdrawals.map((w: WithdrawalDocument) => {
                return {
                    id: w.id,
                    beneficiary: w.beneficiary,
                    amount: w.amount,
                    approved: w.approved,
                    state: w.state,
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
