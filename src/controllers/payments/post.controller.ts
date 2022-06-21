import { Request, Response } from 'express';
import { body } from 'express-validator';
import PaymentService from '@/services/PaymentService';
import { PaymentDocument } from '@/models/Payment';

const validation = [
    body('amount').isNumeric(),
    body('chainId').optional().isNumeric(),
    body('successUrl').optional().isURL(),
    body('failUrl').optional().isURL(),
    body('cancelUrl').optional().isURL(),
];

async function controller(req: Request, res: Response) {
    // #swagger.tags = ['Payments']
    const chainId = req.body.chainId;
    const payment: PaymentDocument = await PaymentService.create(req.assetPool, chainId, req.body);
    const paymentUrl = PaymentService.getPaymentUrl(payment._id, payment.token);

    res.status(201).json({ ...payment.toJSON(), paymentUrl });
}

export default { validation, controller };
