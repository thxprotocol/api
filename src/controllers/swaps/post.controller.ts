import { Request, Response } from 'express';
import { body } from 'express-validator';
import SwapService from '@/services/ERC20SwapService';
import SwapRuleService from '@/services/ERC20SwapRuleService';
import ERC20Service from '@/services/ERC20Service';
import { InsufficientBalanceError, NotFoundError } from '@/util/errors';
import AccountProxy from '@/proxies/AccountProxy';

const validation = [body('amountIn').exists().isNumeric(), body('swapRuleId').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20Swaps']
    const swapRule = await SwapRuleService.get(req.body.swapRuleId);
    if (!swapRule) throw new NotFoundError('Could not find this Swap Rule');

    const erc20 = await ERC20Service.getById(swapRule.tokenInId);
    const account = await AccountProxy.getById(req.auth.sub);
    const userBalance = await erc20.contract.methods.balanceOf(account.address).call();
    if (Number(userBalance) < Number(req.body.amountIn)) throw new InsufficientBalanceError();

    const swap = await SwapService.create(req.assetPool, account, swapRule, erc20, req.body.amountIn);

    res.json(swap);
};

export default {
    validation,
    controller,
};
