import { NextFunction, Response } from 'express';
import { AssetPoolDocument } from '../../models/AssetPool';
import { AssetPool } from '../../models/AssetPool';
import { HttpError, HttpRequest } from '../../models/Error';
import { getWithdrawalData } from './get.action';

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
        const withdrawals = [];
        const filteredLogs = withdrawPollCreatedLogs.filter(
            (log) => !withdrawnLogs.find((l) => l.args.id.toNumber() === log.args.id.toNumber()),
        );

        for (const log of filteredLogs) {
            const withdrawal = await getWithdrawalData(req.solution, log.args.id.toNumber());
            withdrawals.push(withdrawal);
        }

        res.json({
            withdrawn: withdrawnLogs.map((log) => {
                return {
                    id: log.args.id.toNumber(),
                    member: log.args.member,
                    reward: log.args.reward,
                };
            }),
            withdrawals,
        });
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
