import { NextFunction, Response } from "express";
import { HttpRequest, HttpError } from "../../models/Error";

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
export const getWithdrawal = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { beneficiary, amount, state, pollId } = await req.solution.getWithdrawPoll(req.params.id);

        res.json({
            beneficiary,
            amount,
            state,
            pollId,
        });
    } catch (err) {
        next(new HttpError(502, "Withdraw Poll get data failed.", err));
    }
};
