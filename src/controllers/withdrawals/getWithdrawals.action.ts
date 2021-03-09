import { BigNumber, Contract } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import { NextFunction, Response } from 'express';
import { ContractEventDocument } from '../../models/ContractEvent';
import { ContractEvent } from '../../models/ContractEvent';
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
            amount: formatEther(amount),
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
        const filteredEvents = withdrawPollCreatedEvents.filter((withdrawPollCreatedEvent: ContractEventDocument) => {
            const res = withdrawnEvents.find((withdrawnEvent: ContractEventDocument) => {
                const withdrawnEventID = BigNumber.from(withdrawnEvent.args.id).toNumber();
                const withdrawPollCreatedID = BigNumber.from(withdrawPollCreatedEvent.args.id).toNumber();

                return withdrawnEventID === withdrawPollCreatedID;
            });
            return !res;
        });
        const withdrawPolls = [];

        for (const event of filteredEvents) {
            const id = BigNumber.from(event.args.id).toNumber();
            const withdrawPoll = await getWithdrawPoll(req.solution, id);

            withdrawPolls.push(withdrawPoll);
        }

        console.log(withdrawPolls);

        res.json({
            withdrawn: withdrawnEvents.map((log: ContractEventDocument) => {
                return {
                    id: BigNumber.from(log.args.id).toNumber(),
                    member: log.args.member,
                    amount: formatEther(BigNumber.from(log.args.reward)),
                };
            }),
            withdrawPolls,
        });
    } catch (err) {
        next(new HttpError(502, 'Get WithdrawPollCreated logs failed.', err));
    }
};
