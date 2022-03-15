import { Request, Response } from 'express';
import { body } from 'express-validator';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '@/util/errors';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import { tokenContract } from '@/util/network';
import { toWei } from 'web3-utils';
import { TDeposit } from '@/types/TDeposit';
import { DepositDocument } from '@/models/Deposit';
import AccountProxy from '@/proxies/AccountProxy';
import DepositService from '@/services/DepositService';
import PromoCodeService from '@/services/PromoCodeService';
import TransactionService from '@/services/TransactionService';

export const createDepositValidation = [
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('item').optional().isString().isLength({ min: 24, max: 24 }),
];

export default async function CreateDepositController(req: Request, res: Response) {
    const promoCode = await PromoCodeService.findById(req.body.item);
    if (!promoCode) throw new Error();

    const account = await AccountProxy.getById(req.user.sub);
    const amount = Number(toWei(String(promoCode.price)));

    const tokenAddress = await TransactionService.call(
        req.assetPool.solution.methods.getToken(),
        req.assetPool.network,
    );
    const token = tokenContract(req.assetPool.network, tokenAddress);

    // Check balance to ensure throughput
    const balance = await TransactionService.call(token.methods.balanceOf(account.address), req.assetPool.network);
    if (balance < amount) throw new InsufficientBalanceError();

    // Check allowance for admin to ensure throughput
    const allowance = await DepositService.getAllowance(req.assetPool, token, account);
    if (allowance < amount) throw new AmountExceedsAllowanceError();

    let d: DepositDocument = await DepositService.schedule(req.assetPool, account, promoCode.price, req.body.item);
    d = await DepositService.create(req.assetPool, d, req.body.call, req.body.nonce, req.body.sig);

    agenda.now(eventNameRequireTransactions, {});

    const result: TDeposit = {
        id: String(d._id),
        sub: d.sub,
        sender: d.sender,
        receiver: d.receiver,
        amount: d.amount,
        state: d.state,
        transactions: d.transactions,
        createdAt: d.createdAt,
    };

    res.json(result);
}
