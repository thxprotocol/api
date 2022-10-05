import { Request, Response } from 'express';
import PaymentService from '@/services/PaymentService';
import { PaymentDocument } from '@/models/Payment';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Payments']
    const payments = await PaymentService.findByPool(req.assetPool);

    res.json(
        payments.map((payment: PaymentDocument) => {
            const paymentUrl = PaymentService.getPaymentUrl(payment.id, payment.token);

            return { ...payment.toJSON(), paymentUrl };
        }),
    );
};

export default { controller };
