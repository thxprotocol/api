import { Request, Response } from 'express';
import { body } from 'express-validator';
import AccountProxy from '../../proxies/AccountProxy';
import PaymentService from '../../services/PaymentService';
import PromoCodeService from '../../services/PromoCodeService';

export const createPaymentValidation = [body('item').isString().isLength({ min: 24, max: 24 })];

export default async function CreatePaymentController(req: Request, res: Response) {
    const promoCode = await PromoCodeService.findById(req.body.item);
    const { account } = await AccountProxy.getById(req.user.sub);
    const { _id, sender, receiver, amount, state } = await PaymentService.create(
        req.assetPool,
        account,
        promoCode.price,
        req.body.item,
        req.assetPool.network,
    );

    res.json({ id: String(_id), sender, receiver, amount, state });
}
