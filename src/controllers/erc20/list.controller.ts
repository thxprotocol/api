import ERC20Service from '@/services/ERC20Service';
import { Request, Response } from 'express';
import { query } from 'express-validator';

export const validation = [query('archived').optional().isBoolean()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const erc20s = await ERC20Service.getAll(req.auth.sub);
    const archived = req.query.archived == 'true' ? true : false;
    return res.send(erc20s.filter((x) => x.archived === archived).map(({ _id }) => _id));
};

export default { controller, validation };
