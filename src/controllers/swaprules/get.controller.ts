import { Request, Response } from 'express';
import ERC20SwapRuleService from '@/services/ERC20SwapRuleService';
import { param } from 'express-validator';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const members = await ERC20SwapRuleService.get(req.params.id);

    res.json(members);
};

export default { controller, validation };
