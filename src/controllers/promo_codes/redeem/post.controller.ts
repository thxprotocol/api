import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { callFunction, getProvider } from '../../../util/network';
import { getPromoCodeById, redeemTokens } from '../../../services/PromoCodeService';
import AccountProxy from '../../../proxies/AccountProxy';

const redeemPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

async function RedeemPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { admin } = getProvider(req.assetPool.network);
    const promoCode = await getPromoCodeById(req.params.id);
    const { account } = await AccountProxy.getById(req.user.sub);

    // Transfers the promo code
    await redeemTokens(req.assetPool, account.address, admin.address, promoCode.price, req.assetPool.network);

    // Unlock

    res.json(promoCode);
}

export { redeemPromoCodeValidation };
export default RedeemPromoCodeController;
