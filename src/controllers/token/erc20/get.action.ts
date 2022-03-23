import { Request, Response } from 'express';
<<<<<<< HEAD
import ERC20Service from '@/services/ERC20Service';

export const getById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await ERC20Service.getById(id);
    const totalSupply = await token.getTotalSupply();
    return res.send({ token: { ...token.toJSON(), totalSupply } });
=======
import TokenService from '@/services/TokenService';

export const getERC20TokenById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await TokenService.getERC20TokenById(id);
    return res.send({ token: token.toJSON() });
>>>>>>> 2054b1e (feat: add get_by_id, get_all route and add transferAllERC20MintedToken method)
};
