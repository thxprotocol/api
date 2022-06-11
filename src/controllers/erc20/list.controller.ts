import ERC20Service from '@/services/ERC20Service';
import { Request, Response } from 'express';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const erc20s = await ERC20Service.getAll(req.user.sub);
    return res.send(erc20s.map(({ _id }) => _id));
};

export default { controller };
