import { NextFunction, Request, Response } from 'express';
import { withdrawPollContract } from '../../util/network';
import { HttpError } from '../../models/Error';

/**
 * @swagger
 * /withdrawals/:address:
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
 *              startTime:
 *                  type: string
 *                  description: DateTime of the start of the poll
 *              endTime:
 *                  type: string
 *                  description: DateTime of the start of the poll
 *              withdrawal:
 *                  type: string
 *                  description: Address of the withdraw poll
 *              beneficiary:
 *                  type: string
 *                  description: Beneficiary of the withdraw poll
 *              amount:
 *                  type: string
 *                  description: Rewarded amount for the beneficiary
 *              state:
 *                  type: string
 *                  description: WithdrawState [Pending, Approved, Rejected, Withdrawn]
 *              yesCounter:
 *                  type: string
 *                  description: Amount of yes votes
 *              noCounter:
 *                  type: string
 *                  description: Amount of no votes
 *              totalVotes:
 *                  type: string
 *                  description: Total amount of votes
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
export const getWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const withdrawal = withdrawPollContract(req.params.address);
        const beneficiary = await withdrawal.beneficiary();
        const amount = await withdrawal.amount();
        const approvalState = await withdrawal.getCurrentApprovalState();
        const startTime = (await withdrawal.startTime()).toNumber();
        const endTime = (await withdrawal.endTime()).toNumber();
        const yesCounter = (await withdrawal.yesCounter()).toNumber();
        const noCounter = (await withdrawal.noCounter()).toNumber();
        const totalVoted = (await withdrawal.totalVoted()).toNumber();

        res.json({
            startTime: {
                raw: startTime,
                formatted: new Date(startTime * 1000),
            },
            endTime: {
                raw: endTime,
                formatted: new Date(endTime * 1000),
            },
            address: withdrawal.address,
            beneficiary,
            amount,
            approvalState,
            yesCounter,
            noCounter,
            totalVoted,
        });
    } catch (err) {
        next(new HttpError(502, 'Withdraw Poll get data failed.', err));
    }
};
