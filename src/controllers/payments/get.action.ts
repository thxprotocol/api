import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import PaymentService from '@/services/PaymentService';

export const getPaymentValidation = [param('id').exists()];

export const getPayment = async (req: Request, res: Response) => {
    const payment = await PaymentService.get(req.params.id);
    if (!payment) throw new NotFoundError();

    res.json(payment);
};
