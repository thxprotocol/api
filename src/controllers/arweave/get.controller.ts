import ArweaveService from '@/services/ArweaveService';
import { Request, Response } from 'express';
import { param } from 'express-validator';
const validation = [param('id').exists().isString()];

const controller = async (req: Request, res: Response) => {
    const result = await ArweaveService.getData(req.params.id);
    res.json(result);
};

export default { controller, validation };
