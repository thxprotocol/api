import { Request, Response } from 'express';
import { body } from 'express-validator';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import ERC20SwapRuleService from '@/services/ERC20SwapRuleService';

const validation = [body('tokenInAddress').exists(), body('tokenMultiplier').exists().isInt({ gt: 0 })];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const erc20SwapRule = await ERC20SwapRuleService.erc20SwapRule(
        req.assetPool,
        String(req.query.tokenInAddress),
        Number(req.query.tokenMultiplier),
    );

    agenda.now(eventNameRequireTransactions, {});

    res.json(erc20SwapRule);
};

export default {
    validation,
    controller,
};
