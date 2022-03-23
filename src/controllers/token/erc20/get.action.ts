import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';

export const getERC20TokenById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await TokenService.getERC20TokenById(id);
    return res.send({ token: token.toJSON() });
};
