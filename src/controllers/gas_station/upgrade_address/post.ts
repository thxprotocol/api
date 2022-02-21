import { Request, Response } from 'express';
import { callFunction, sendTransaction } from '@/util/network';
import { parseLogs, assertEvent } from '@/util/events';
import { Artifacts } from '@/util/artifacts';
import AccountProxy from '@/proxies/AccountProxy';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import { WithdrawalState } from '@/enums';
import { body } from 'express-validator';
import { InternalServerError } from '@/util/errors';

export const createCallUpgradeAddressValidation = [
    body('newAddress').isEthereumAddress(),
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
];

export const postCallUpgradeAddress = async (req: Request, res: Response) => {
    const isMember = await callFunction(
        req.assetPool.solution.methods.isMember(req.body.newAddress),
        req.assetPool.network,
    );

    if (!isMember) {
        await sendTransaction(
            req.assetPool.solution.options.address,
            req.assetPool.solution.methods.addMember(req.body.newAddress),
            req.assetPool.network,
        );
    }

    const tx = await sendTransaction(
        req.assetPool.solution.options.address,
        req.assetPool.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
        req.assetPool.network,
    );
    const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
    const event = assertEvent('MemberAddressChanged', events);

    const account = await AccountProxy.getByAddress(event.args.previousAddress);

    await AccountProxy.update(account.id, { address: event.args.newAddress });

    const withdrawals = await WithdrawalService.getByBeneficiary(event.args.previousAddress);
    if (!withdrawals) throw new InternalServerError('Could not find a withdrawal for this beneficiary');

    for (const withdrawal of withdrawals) {
        withdrawal.beneficiary = event.args.newAddress;
        withdrawal.state = WithdrawalState.Pending;

        await withdrawal.save();
    }

    const member = await MemberService.findByAddress(event.args.previousAddress);

    member.address = event.args.newAddress;

    await member.save();

    return res.status(200).end();
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
