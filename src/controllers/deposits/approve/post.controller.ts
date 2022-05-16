import { Request, Response } from 'express';
import { body } from 'express-validator';
import { ForbiddenError } from '@/util/errors';
import { toWei } from 'web3-utils';
import AccountProxy from '@/proxies/AccountProxy';
import ERC20Service from '@/services/ERC20Service';
import { getContractFromName } from '@/config/contracts';
import TransactionService from '@/services/TransactionService';
import { MaxUint256 } from '@/util/jest/constants';
import { NetworkProvider } from '@/types/enums';

const validation = [body('amount').optional().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    if (req.assetPool.network === NetworkProvider.Main) throw new ForbiddenError('Not available for main net yet.');

    const account = await AccountProxy.getById(req.user.sub);
    const amount = req.body.amount ? toWei(String(req.body.amount)) : MaxUint256;
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.network, 'LimitedSupplyToken', erc20.address);

    // Check allowance for admin to ensure throughput
    const allowance = Number(await contract.methods.allowance(account.address, req.assetPool.address).call());
    if (allowance >= Number(amount)) throw new ForbiddenError('Already approved for this amount');

    await TransactionService.sendValue(account.address, toWei('0.01'), req.assetPool.network);

    res.end();
};

export default { controller, validation };
