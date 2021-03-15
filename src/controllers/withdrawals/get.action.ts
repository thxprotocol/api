import { formatEther } from 'ethers/lib/utils';
import { NextFunction, Response } from 'express';
import { HttpRequest, HttpError } from '../../models/Error';
import { Contract } from '@ethersproject/contracts';

export async function getWithdrawalData(solution: Contract, id: number) {
    try {
        const beneficiaryId = await solution.getBeneficiary(id);

        return {
            id,
            beneficiary: await solution.getAddressByMember(beneficiaryId),
            amount: Number(formatEther(await solution.getAmount(id))),
            approved: await solution.withdrawPollApprovalState(id),
            poll: {
                startTime: (await solution.getStartTime(id)).toNumber(),
                endTime: (await solution.getEndTime(id)).toNumber(),
                yesCounter: (await solution.getYesCounter(id)).toNumber(),
                noCounter: (await solution.getNoCounter(id)).toNumber(),
                totalVoted: (await solution.getTotalVoted(id)).toNumber(),
            },
        };
    } catch (e) {
        return;
    }
}

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
 *              approved:
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
        const withdrawal = await getWithdrawalData(req.solution, Number(req.params.id));

        if (!withdrawal) {
            return next(new HttpError(404, 'Could not find a withdrawal for this ID.'));
        }

        res.json(withdrawal);
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
