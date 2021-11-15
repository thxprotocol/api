import { Response, NextFunction } from 'express';
import { callFunction, sendTransaction } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { parseLogs, findEvent } from '../../util/events';
import { Artifacts } from '../../util/artifacts';
import AccountService from '../../services/AccountService';
import WithdrawalService from '../../services/WithdrawalService';
import MemberService from '../../services/MemberService';

export const postCallUpgradeAddress = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const isMember = await callFunction(req.solution.methods.isMember(req.body.newAddress), req.assetPool.network);

        if (!isMember) {
            await sendTransaction(
                req.solution.options.address,
                req.solution.methods.addMember(req.body.newAddress),
                req.assetPool.network,
            );
        }

        try {
            const tx = await sendTransaction(
                req.solution.options.address,
                req.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
                req.assetPool.network,
            );
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('MemberAddressChanged', events);

            if (event) {
                try {
                    const { account } = await AccountService.getByAddress(event.args.previousAddress);

                    account.address = event.args.newAddress;
                    account.privateKey = '';

                    await account.save();

                    try {
                        const { withdrawals, error } = await WithdrawalService.getByBeneficiary(
                            event.args.previousAddress,
                        );
                        if (error) throw new Error(error);
                        for (const withdrawal of withdrawals) {
                            withdrawal.beneficiary = event.args.newAddress;
                            await withdrawal.save();
                        }

                        const { member } = await MemberService.findByAddress(event.args.previousAddress);

                        member.address = event.args.newAddress;

                        await member.save();

                        return res.status(200).end();
                    } catch (e) {
                        return next(new HttpError(502, 'Could not migrate the withdrawals in db.', e));
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could not store the new address for the account.', e));
                }
            } else {
                return next(new HttpError(502, 'No event in the result after sending calldata.'));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not change the address for the member.', e));
        }
    } catch (e) {
        return next(new HttpError(502, 'Could not add the new address as a member.', e));
    }
};


/**
 * @swagger
 * /gas_station/upgrade_address:
 *   post:
 *     tags:
 *       - Gas Station
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: newAddress
 *         in: body
 *         required: true
 *         type: string
 *       - name: call
 *         in: body
 *         required: true
 *         type: string
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: string
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Ok
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to make this call.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */