import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '@/util/errors';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import { getContractFromName } from '@/config/contracts';
import ERC20Service from '@/services/ERC20Service';
import PaymentService from '@/services/PaymentService';
import { recoverAddress } from '@/util/network';

const validation = [
    param('id').isMongoId(),
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('amount').isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    const { call, nonce, sig, amount } = req.body;
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.network, 'LimitedSupplyToken', erc20.address);
    let payment = await PaymentService.get(req.params.id);

    payment.sender = recoverAddress(call, nonce, sig);
    await payment.save();

    // Check balance to ensure throughput
    const balance = await contract.methods.balanceOf(payment.sender).call();
    if (balance < Number(amount)) throw new InsufficientBalanceError();

    // Check allowance to ensure throughput
    const allowance = Number(await contract.methods.allowance(payment.sender, req.assetPool.address).call());
    if (allowance < Number(amount)) throw new AmountExceedsAllowanceError();

    payment = await PaymentService.pay(req.assetPool, payment, { call, nonce, sig });

    agenda.now(eventNameRequireTransactions, {});

    res.json(payment);
};

export default {
    validation,
    controller,
};
