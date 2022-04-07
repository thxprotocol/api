import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';

export const deleteERC20TokenValidation = [param('id').exists().isMongoId()];

export const DeleteERC20Controller = async (req: Request, res: Response) => {
    await ERC20Service.removeById(req.params.id);

    return res.status(204).end();
};
