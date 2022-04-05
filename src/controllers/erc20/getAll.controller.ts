import ERC20Service from '@/services/ERC20Service';
import { Request, Response } from 'express';

export const getAllERC20Token = async (req: Request, res: Response) => {
    const tokens = await ERC20Service.getAll(req.user.sub);
    const promises = tokens.map((token) => token.getResponse());
    const result = await Promise.all(promises);

    return res.send(result);
};
