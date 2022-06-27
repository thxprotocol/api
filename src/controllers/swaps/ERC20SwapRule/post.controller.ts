import { Request, Response } from 'express';
import { body } from 'express-validator';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import ERC20SwapRuleService from '@/services/ERC20SwapRuleService';

const validation = [
    body('tokenInAddress').exists(),
    body('tokenMultiplier').exists().isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const erc20SwapRule = await ERC20SwapRuleService.erc20SwapRule(
        req.assetPool,
        String(req.body.tokenInAddress),
        Number(req.body.tokenMultiplier),
    );

    agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

    res.json(erc20SwapRule);
};

export default {
    validation,
    controller,
};
