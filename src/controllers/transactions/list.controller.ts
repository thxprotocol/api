import { Request, Response } from 'express';
import { query } from 'express-validator';
import TransactionService from '@/services/TransactionService';

const validation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

const controller = async (req: Request, res: Response) => {
    const response = await TransactionService.findByQuery(
        { poolAddress: req.params.address },
        Number(req.query.page),
        Number(req.query.limit),
    );

    res.send(response);
};

export default { controller, validation };
