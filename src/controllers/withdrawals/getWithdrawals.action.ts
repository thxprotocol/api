import { BigNumber } from 'ethers/lib/ethers';
import { formatEther } from 'ethers/lib/utils';
import { NextFunction, Response } from 'express';
import { ContractEventDocument } from '../../models/ContractEvent';
import { ContractEvent } from '../../models/ContractEvent';
import { HttpError, HttpRequest } from '../../models/Error';
import { getWithdrawalData } from './get.action';

function getFilteredEvents(
    withdrawnEvents: ContractEventDocument[],
    withdrawPollCreatedEvents: ContractEventDocument[],
) {
    return withdrawPollCreatedEvents.filter((withdrawPollCreatedEvent: ContractEventDocument) => {
        const withdrawPollCreatedID = BigNumber.from(withdrawPollCreatedEvent.args.id).toNumber();
        const withdrawn = withdrawnEvents.find((withdrawnEvent: ContractEventDocument) => {
            const withdrawnEventID = BigNumber.from(withdrawnEvent.args.id).toNumber();
            return withdrawnEventID === withdrawPollCreatedID;
        });
        return !withdrawn;
    });
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
        const memberID = await req.solution.getMemberByAddress(req.query.member);
        const withdrawnEvents = await ContractEvent.find({
            'contractAddress': req.solution.address,
            'name': 'Withdrawn',
            'args.member': req.query.member,
        });
        const withdrawPollCreatedEvents = await ContractEvent.find({
            'contractAddress': req.solution.address,
            'name': 'WithdrawPollCreated',
            'args.member': memberID,
        });
        const filteredEvents = getFilteredEvents(withdrawnEvents, withdrawPollCreatedEvents);
        const withdrawals = [];

        for (const log of filteredEvents) {
            const withdrawal = await getWithdrawalData(req.solution, BigNumber.from(log.args.id).toNumber());
            withdrawals.push(withdrawal);
        }

        res.json({
            withdrawn: withdrawnEvents.map((log: ContractEventDocument) => {
                return {
                    id: BigNumber.from(log.args.id).toNumber(),
                    member: log.args.member,
                    amount: Number(formatEther(BigNumber.from(log.args.reward))),
                };
            }),
            withdrawals,
        });
    } catch (err) {
        next(new HttpError(502, 'Could not get all withdrawal information from the network.', err));
    }
};
