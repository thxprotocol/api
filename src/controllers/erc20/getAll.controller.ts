import ERC20Service from '@/services/ERC20Service';
import { Request, Response } from 'express';

export const getAllERC20Token = async (req: Request, res: Response) => {
    const tokens = await ERC20Service.getAll(req.user.sub);

    return res.send(tokens.map(({ _id }) => _id));
};
