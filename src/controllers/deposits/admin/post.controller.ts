import { Request, Response } from 'express';
import { body } from 'express-validator';
import { BadRequestError, InsufficientBalanceError } from '@/util/errors';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import { toWei } from 'web3-utils';
import { TDeposit } from '@/types/TDeposit';
import { DepositDocument } from '@/models/Deposit';
import DepositService from '@/services/DepositService';
import ERC20Service from '@/services/ERC20Service';
import { getProvider } from '@/util/network';
import { ethers } from 'ethers';
import { IAccount } from '@/models/Account';
import TransactionService from '@/services/TransactionService';
import { ERC20Type } from '@/types/enums';

export const validation = [body('amount').isInt({ gt: 0 })];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    const { admin } = getProvider(req.assetPool.network);
    const account = { address: admin.address } as IAccount;
    const amount = Number(toWei(String(req.body.amount)));
    const address = await req.assetPool.contract.methods.getToken().call();
    const erc20 = await ERC20Service.findBy({ address, network: req.assetPool.network });

    if (erc20.type !== ERC20Type.Limited) throw new BadRequestError('Token type is not Limited type');

    // Check balance to ensure throughput
    const balance = await erc20.contract.methods.balanceOf(account.address).call();
    if (balance < amount) throw new InsufficientBalanceError();

    // Check allowance for admin to ensure throughput
    const allowance = Number(await erc20.contract.methods.allowance(account.address, req.assetPool.address).call());
    if (allowance < amount) {
        await TransactionService.send(
            erc20.contract.options.address,
            erc20.contract.methods.approve(req.assetPool.address, ethers.constants.MaxUint256),
            req.assetPool.network,
        );
    }
    let deposit: DepositDocument = await DepositService.schedule(req.assetPool, account, amount);

    deposit = await DepositService.depositForAdmin(req.assetPool, deposit);

    agenda.now(eventNameRequireTransactions, {});

    res.json(deposit);
};

export default {
    validation,
    controller,
};
