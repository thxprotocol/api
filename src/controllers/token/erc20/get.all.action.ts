import TokenService from '@/services/TokenService';
import { Request, Response } from 'express';

export const getAllERC20Token = async (req: Request, res: Response) => {
    const tokens = await TokenService.getAllERC20TokenBySub(req.user.sub);
    res.send({ tokens: tokens.map((token) => token.toJSON()) });
};
