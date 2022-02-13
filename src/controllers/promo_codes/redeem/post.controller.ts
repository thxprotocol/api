import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { callFunction, getProvider } from '../../../util/network';
import { getPromoCodeById, redeemTokens } from '../../../services/PromoCodeService';
import AccountProxy from '../../../proxies/AccountProxy';

const redeemPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

async function RedeemPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { admin } = getProvider(req.assetPool.network);
    const promoCode = await getPromoCodeById(req.params.id);
    const tokenAddress = await callFunction(req.assetPool.solution.methods.getToken(), req.assetPool.network);
    const { account } = await AccountProxy.getById(req.user.sub);

    await redeemTokens(tokenAddress, account.address, admin.address, promoCode.price, req.assetPool.network);

    res.end(200);
}

export { redeemPromoCodeValidation };
export default RedeemPromoCodeController;
