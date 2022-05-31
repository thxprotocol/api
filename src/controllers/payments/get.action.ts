import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import PaymentService from '@/services/PaymentService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    const payment = await PaymentService.get(req.params.id);
    if (!payment) throw new NotFoundError();

    res.json(payment);
};

export default { validation, controller };
