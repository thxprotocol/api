import { Request, Response } from 'express';
import { body } from 'express-validator';
import { toWei } from 'web3-utils';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import SwapService from '@/services/ERC20SwapService';
import SwapRuleService from '@/services/ERC20SwapRuleService';
import { recoverAddress } from '@/util/network';
import ERC20Service from '@/services/ERC20Service';
import { InsufficientBalanceError, NotFoundError } from '@/util/errors';

const validation = [
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('amountIn').exists().isNumeric(),
    body('swapRuleId').isMongoId(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20Swaps']
    const { call, nonce, sig } = req.body;
    const swapRule = await SwapRuleService.get(req.body.swapRuleId);
    if (!swapRule) throw new NotFoundError('Could not find this Swap Rule');

    const erc20 = await ERC20Service.getById(swapRule.tokenInId);
    const erc20TokenIn = await ERC20Service.findOrImport(req.assetPool, erc20.address);

    const userWalletAddress = recoverAddress(call, nonce, sig);
    const userBalance = await erc20TokenIn.contract.methods.balanceOf(userWalletAddress).call();
    if (Number(userBalance) < Number(req.body.amountIn)) throw new InsufficientBalanceError();

    const erc20Swap = await SwapService.create(
        req.assetPool,
        req.auth.sub,
        { call, nonce, sig },
        swapRule,
        req.body.amountIn,
    );

    agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

    res.json(erc20Swap);
};

export default {
    validation,
    controller,
};
