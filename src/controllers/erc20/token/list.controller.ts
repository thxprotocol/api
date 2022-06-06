import ERC20Service from '@/services/ERC20Service';
import { ERC20TokenDocument } from '@/models/ERC20Token';
import { Request, Response } from 'express';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const tokens = await ERC20Service.getTokensForSub(req.user.sub);
    res.json(tokens.map(({ _id }: ERC20TokenDocument) => _id));
};

export default { controller };
