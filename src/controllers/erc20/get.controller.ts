import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { param } from 'express-validator';

const validation = [param('id').exists().isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20']
    const token = await ERC20Service.getById(req.params.id);
    return res.send(await token.getResponse());
};

export default { controller, validation };
