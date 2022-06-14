import { Request, Response } from 'express';
import { parseLogs, assertEvent } from '@/util/events';
import AccountProxy from '@/proxies/AccountProxy';
import WithdrawalService from '@/services/WithdrawalService';
import MemberService from '@/services/MemberService';
import { WithdrawalState } from '@/types/enums';
import { body } from 'express-validator';
import { InternalServerError } from '@/util/errors';
import TransactionService from '@/services/TransactionService';

const validation = [
    body('newAddress').isEthereumAddress(),
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Relay Hub']
    const { contract, chainId } = req.assetPool;
    const isMember = await contract.methods.isMember(req.body.newAddress).call();

    if (!isMember) {
        await TransactionService.send(
            contract.options.address,
            contract.methods.addMember(req.body.newAddress),
            chainId,
        );
    }

    const { receipt } = await TransactionService.send(
        contract.options.address,
        contract.methods.call(req.body.call, req.body.nonce, req.body.sig),
        chainId,
        250000,
    );
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
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

export default { controller, validation };
