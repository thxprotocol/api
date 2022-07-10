import { Request, Response } from 'express';
import ERC20SwapService from '@/services/ERC20SwapService';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20Swaps']
    const members = await ERC20SwapService.getAll(req.assetPool);

    res.json(members);
};

export default { controller };
