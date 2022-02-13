import { Request, Response } from 'express';
import { param } from 'express-validator';
import { getProvider } from '../../../util/network';
import { formatPromoCodeResponse, getPromoCodeById, transferTokens } from '../../../services/PromoCodeService';
import { createPayment } from '../../../services/PaymentService';
import AccountProxy from '../../../proxies/AccountProxy';

export const redeemPromoCodeValidation = [param('id').isString().isLength({ min: 24, max: 24 })];

export default async function RedeemPromoCodeController(req: Request, res: Response) {
    const promoCode = await getPromoCodeById(req.params.id);
    const { admin } = getProvider(req.assetPool.network);
    const { account } = await AccountProxy.getById(req.user.sub);

    await transferTokens(req.assetPool, account.address, admin.address, promoCode.price, req.assetPool.network);
    await createPayment({
        sub: req.user.sub,
        sender: account.address,
        receiver: admin.address,
        amount: promoCode.price,
        order: String(promoCode._id),
    });

    const result = await formatPromoCodeResponse(req.user.sub, promoCode);

    res.json(result);
}
