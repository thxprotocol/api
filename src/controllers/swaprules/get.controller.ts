import { Request, Response } from 'express';
import { param } from 'express-validator';
import SwapRuleService from '@/services/ERC20SwapRuleService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const swapRule = await SwapRuleService.get(req.params.id);
    res.json(swapRule);
};

export default { controller, validation };
