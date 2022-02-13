import { toWei } from 'web3-utils';
import { PromoCode } from '../models/PromoCode';
import { IPromoCodeData } from '../interfaces/IPromoCodeData';
import { paginatedResults } from '../util/pagination';
import { AmountExceedsAllowanceError, InsufficientBalanceError, PromoCodeNotFoundError } from '../util/errors';
import { callFunction, NetworkProvider, sendTransaction, tokenContract } from '../util/network';

async function createPromoCode(data: IPromoCodeData) {
    return await PromoCode.create(data);
}

async function getPromoCodeById(id: string) {
    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
        throw new PromoCodeNotFoundError();
    }

    return promoCode;
}

// page 1 and limit 10 are the default pagination start settings
async function listPromoCodesForSub(sub: string, page = 1, limit = 10) {
    return await paginatedResults(PromoCode, page, limit, { sub });
}

async function redeemTokens(
    tokenAddress: string,
    owner: string,
    spender: string,
    price: number,
    npid: NetworkProvider,
) {
    const token = tokenContract(npid, tokenAddress);

    const amount = toWei(String(price));
    const allowance = await callFunction(token.methods.allowance(owner, spender), npid);

    if (allowance < amount) {
        throw new AmountExceedsAllowanceError();
    }

    const balance = await callFunction(token.methods.balanceOf(owner), npid);

    if (balance < amount) {
        throw new InsufficientBalanceError();
    }

    return await sendTransaction(token.options.address, token.methods.transferFrom(owner, spender, amount), npid);
}

export { createPromoCode, getPromoCodeById, listPromoCodesForSub, redeemTokens };
