import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';

export const getById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await ERC20Service.getById(id);
    return res.send({ token: token.toJSON() });
};
