import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { toWei } from 'web3-utils';
import { callFunction, getProvider, sendTransaction, tokenContract } from '../../../util/network';
import { getPromoCodeById } from '../../../services/PromoCodeService';
import AccountProxy from '../../../proxies/AccountProxy';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '../../../util/errors';

const redeemPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

async function RedeemPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { admin } = getProvider(req.assetPool.network);
    const promoCode = await getPromoCodeById(req.params.id);
    const tokenAddress = await callFunction(req.assetPool.solution.methods.getToken(), req.assetPool.network);
    const token = tokenContract(req.assetPool.network, tokenAddress);
    const { account } = await AccountProxy.getById(req.user.sub);
    const amount = toWei(String(promoCode.price));
    const allowance = await callFunction(
        token.methods.allowance(account.address, admin.address),
        req.assetPool.network,
    );

    if (allowance < amount) {
        throw new AmountExceedsAllowanceError();
    }

    const balance = await callFunction(token.methods.balanceOf(account.address), req.assetPool.network);

    if (balance < amount) {
        throw new InsufficientBalanceError();
    }

    const tx = await sendTransaction(
        req.assetPool.address,
        token.methods.transferFrom(account.address, admin.address, amount),
        req.assetPool.network,
    );

    res.json(tx);
}

export { redeemPromoCodeValidation };
export default RedeemPromoCodeController;
