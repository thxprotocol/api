import { Contract } from 'ethers';
import { NextFunction, Response } from 'express';
import { AssetPoolDocument } from '../../models/AssetPool';
import { AssetPool } from '../../models/AssetPool';
import { HttpError, HttpRequest } from '../../models/Error';

async function getWithdrawPoll(solution: Contract, id: number) {
    try {
        const beneficiaryId = await solution.getBeneficiary(id);
        const beneficiary = await solution.getAddressByMember(beneficiaryId);
        const amount = await solution.getAmount(id);
        const approved = await solution.withdrawPollApprovalState(id);

        return {
            id,
            beneficiary,
            amount,
            approved,
        };
    } catch (err) {
        new HttpError(502, 'WithdrawPoll READ failed.', err);
        return;
    }
}

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
        const assetPool: AssetPoolDocument = await AssetPool.findOne({
            address: req.solution.address,
        });
        const memberID = await req.solution.getMemberByAddress(req.query.member);
        const withdrawPollCreatedLogs = await req.solution.queryFilter(
            req.solution.filters.WithdrawPollCreated(null, memberID),
            assetPool.blockNumber || 0,
            'latest',
        );
        const withdrawnLogs = await req.solution.queryFilter(
            req.solution.filters.Withdrawn(null, req.query.member, null),
            assetPool.blockNumber || 0,
            'latest',
        );

        // Get WithdrawPolls
        const withdrawPolls = [];
        const filteredLogs = withdrawPollCreatedLogs.filter(
            (log) => !withdrawnLogs.find((l) => l.args.id.toNumber() === log.args.id.toNumber()),
        );

        for (const log of filteredLogs) {
            const withdrawPoll = await getWithdrawPoll(req.solution, log.args.id.toNumber());
            withdrawPolls.push(withdrawPoll);
        }

        res.json({
            withdrawn: withdrawnLogs.map((log) => {
                return {
                    id: log.args.id.toNumber(),
                    member: log.args.member,
                    reward: log.args.reward,
                };
            }),
            withdrawPolls,
        });
    } catch (err) {
        next(new HttpError(502, 'Get WithdrawPollCreated logs failed.', err));
    }
};
