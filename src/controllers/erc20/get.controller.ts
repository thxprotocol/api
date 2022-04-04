import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';

export const getERC20TokenValidation = [param('id').exists().isMongoId()];

export const getById = async (req: Request, res: Response) => {
    const id = req.params['id'];
    const token = await ERC20Service.getById(id);

    return res.send({ ...(await token.JSON()) });
};
