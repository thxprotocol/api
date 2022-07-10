import { Request, Response } from 'express';
import { body } from 'express-validator';
import { agenda, EVENT_REQUIRE_TRANSACTIONS } from '@/util/agenda';
import SwapRuleService from '@/services/ERC20SwapRuleService';
import { InternalServerError } from '@/util/errors';

const validation = [body('tokenInAddress').exists(), body('tokenMultiplier').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const exists = await SwapRuleService.exists(req.assetPool, req.body.tokenInAddress, req.body.tokenMultiplier);
    if (exists) throw new InternalServerError('A Swap Rule for this Token is already set.');

    const swapRule = await SwapRuleService.create(
        req.assetPool,
        String(req.body.tokenInAddress),
        Number(req.body.tokenMultiplier),
    );

    agenda.now(EVENT_REQUIRE_TRANSACTIONS, {});

    res.json(swapRule);
};

export default {
    validation,
    controller,
};
