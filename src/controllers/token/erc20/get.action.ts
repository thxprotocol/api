import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';

export const getById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await ERC20Service.getById(id);
    const totalSupply = await token.getTotalSupply();
    return res.send({ token: { ...token.toJSON(), totalSupply } });
};
