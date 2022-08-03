import { Request, Response } from 'express';
import { body } from 'express-validator';
import { AmountExceedsAllowanceError, InsufficientBalanceError, NotFoundError } from '@/util/errors';
import { toWei } from 'web3-utils';
import DepositService from '@/services/DepositService';
import ERC20Service from '@/services/ERC20Service';
import PromotionService from '@/services/PromotionService';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('item').optional().isMongoId(),
    body('amount').optional().isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    let value = req.body.amount;

    // If an item is referenced, replace the amount value with the price value
    if (req.body.item) {
        const promoCode = await PromotionService.findById(req.body.item);
        if (!promoCode) throw new NotFoundError('Could not find promotion');
        value = promoCode.price;
    }

    const account = await AccountProxy.getById(req.auth.sub);
    const amount = toWei(String(value));
    const erc20 = await ERC20Service.findByPool(req.assetPool);

    // Check balance to ensure throughput
    const balance = await erc20.contract.methods.balanceOf(account.address).call();
    if (balance < Number(amount)) throw new InsufficientBalanceError();

    // Check allowance for admin to ensure throughput
    const allowance = Number(await erc20.contract.methods.allowance(account.address, req.assetPool.address).call());
    if (allowance < Number(amount)) throw new AmountExceedsAllowanceError();

    const { call, nonce, sig } = req.body;
    const deposit = await DepositService.deposit(req.assetPool, account, value, { call, nonce, sig }, req.body.item);

    res.json(deposit);
};

export default {
    validation,
    controller,
};
