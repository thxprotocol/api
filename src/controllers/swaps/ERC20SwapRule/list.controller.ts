import { Request, Response } from 'express';
import ERC20SwapRuleService from '@/services/ERC20SwapRuleService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20SwapRules']
    const members = await ERC20SwapRuleService.getAll(req.assetPool);

    res.json(members);
};

export default { controller };
