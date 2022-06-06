import { Request, Response } from 'express';
import { query } from 'express-validator';
import TransactionService from '@/services/TransactionService';

const validation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

const controller = async (req: Request, res: Response) => {
    const response = await TransactionService.findByQuery(
        { poolAddress: req.params.address },
        req.query.page ? Number(req.query.page) : null, // Will default to 1 if undefined
        req.query.limit ? Number(req.query.limit) : null, // Will default to 10 if undefined
    );

    res.send(response);
};

export default { controller, validation };
