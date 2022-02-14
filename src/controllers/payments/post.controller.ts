import { Request, Response } from 'express';
import { body } from 'express-validator';
import { getProvider } from '../../util/network';
import { getPromoCodeById, transferTokens } from '../../services/PromoCodeService';
import { createPayment } from '../../services/PaymentService';
import AccountProxy from '../../proxies/AccountProxy';

export const createPaymentValidation = [body('item').isString().isLength({ min: 24, max: 24 })];

export default async function CreatePaymentController(req: Request, res: Response) {
    const promoCode = await getPromoCodeById(req.body.item);
    const { admin } = getProvider(req.assetPool.network);
    const { account } = await AccountProxy.getById(req.user.sub);

    await transferTokens(req.assetPool, account.address, admin.address, promoCode.price, req.assetPool.network);
    await createPayment({
        sub: req.user.sub,
        sender: account.address,
        receiver: admin.address,
        amount: promoCode.price,
        item: String(promoCode._id),
    });

    res.end(200);
}
