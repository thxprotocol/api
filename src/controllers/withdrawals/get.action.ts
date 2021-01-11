import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../models/Error';
import { solutionContract } from '../../util/network';

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
 *              beneficiary:
 *                  type: string
 *                  description: Beneficiary of the withdraw poll
 *              amount:
 *                  type: string
 *                  description: Rewarded amount for the beneficiary
 *              state:
 *                  type: string
 *                  description: WithdrawState [Pending, Approved, Rejected, Withdrawn]
 *              poll:
 *                  type: object
 *                  properties:
 *                     address:
 *                        type: string
 *                        description: Address of the reward poll
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
        const withdrawal = solutionContract(req.header('AssetPool'));
        const beneficiary = await withdrawal.beneficiary();
        const amount = await withdrawal.amount();
        const state = await withdrawal.getCurrentApprovalState();

        res.json({
            beneficiary,
            amount,
            state,
            poll: {
                address: withdrawal.address,
            },
        });
    } catch (err) {
        next(new HttpError(502, 'Withdraw Poll get data failed.', err));
    }
};
