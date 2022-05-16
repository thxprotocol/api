import { Request, Response } from 'express';
import { body } from 'express-validator';
import { AmountExceedsAllowanceError, InsufficientBalanceError, NotFoundError } from '@/util/errors';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import { toWei } from 'web3-utils';
import { TDeposit } from '@/types/TDeposit';
import { DepositDocument } from '@/models/Deposit';
import DepositService from '@/services/DepositService';
import ERC20Service from '@/services/ERC20Service';
import { getProvider } from '@/util/network';
import { ethers } from 'ethers';
import { IAccount } from '@/models/Account';
import { getContractFromName } from '@/config/contracts';
import PromotionService from '@/services/PromotionService';
import AccountProxy from '@/proxies/AccountProxy';
import TransactionService from '@/services/TransactionService';

const createDepositValidation = [
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('item').optional().isMongoId(),
    body('amount').optional().isNumeric(),
];

const createDepositController = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    let value = req.body.amount;

    // If an item is referenced, replace the amount value with the price value
    if (req.body.item) {
        const promoCode = await PromotionService.findById(req.body.item);
        if (!promoCode) throw new NotFoundError('Could not find promotion');
        value = promoCode.price;
    }

    const account = await AccountProxy.getById(req.user.sub);
    const amount = Number(toWei(String(value)));
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.network, 'LimitedSupplyToken', erc20.address);

    // Check balance to ensure throughput
    const balance = await contract.methods.balanceOf(account.address).call();
    if (balance < amount) throw new InsufficientBalanceError();

    // Check allowance for admin to ensure throughput
    const allowance = Number(await contract.methods.allowance(account.address, req.assetPool.address).call());
    if (allowance < amount) throw new AmountExceedsAllowanceError();

    let d: DepositDocument = await DepositService.schedule(req.assetPool, account, value, req.body.item);
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
};

export const createAssetPoolDepositValidation = [
    body('amount').isNumeric()
];

const createAssetPoolDepositController = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    let value = req.body.amount;
    const { admin } = getProvider(req.assetPool.network);
    const account = {address: admin.address} as IAccount;
    const amount = Number(toWei(String(value)));
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.network, 'LimitedSupplyToken', erc20.address);
    
    // Check balance to ensure throughput
    const balance = await contract.methods.balanceOf(account.address).call();
    if (balance < amount) throw new InsufficientBalanceError();
    
    // Check allowance for admin to ensure throughput
    const allowance = Number(await contract.methods.allowance(account.address, req.assetPool.address).call());
    if (allowance < amount) {
        await TransactionService.send(
            contract.options.address,
            contract.methods.approve(req.assetPool.address, ethers.constants.MaxUint256),
            req.assetPool.network,
        );
    }
    let d: DepositDocument = await DepositService.schedule(req.assetPool, account, amount);
    d = await DepositService.depositForAdmin(req.assetPool, d);

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

export default { createDepositValidation, createDepositController, createAssetPoolDepositValidation, createAssetPoolDepositController };

