import ERC20 from '@/models/ERC20';
import ERC20Service from '@/services/ERC20Service';
import { Request, Response } from 'express';
import { query } from 'express-validator';

export const validation = [query('archived').optional().isBoolean()];

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    let erc20s;
    if (req.query.archived == 'true') {
        erc20s = await ERC20Service.getAll(req.auth.sub);
    } else {
        erc20s = await ERC20.find({ sub: req.auth.sub, archived: false });
    }

    return res.send(erc20s.map(({ _id }) => _id));
};

export default { controller, validation };
