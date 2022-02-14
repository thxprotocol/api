import { toWei } from 'web3-utils';
import { PromoCode, PromoCodeDocument } from '../models/PromoCode';
import { IPromoCodeData } from '../interfaces/IPromoCodeData';
import { paginatedResults } from '../util/pagination';
import { AmountExceedsAllowanceError, InsufficientBalanceError, PromoCodeNotFoundError } from '../util/errors';
import { callFunction, NetworkProvider, sendTransaction, tokenContract } from '../util/network';
import { IAssetPool } from '../models/AssetPool';
import { Payment } from '../models/Payment';

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

async function formatPromoCodeResponse(sub: string, promoCode: PromoCodeDocument) {
    let protectedValue;

    // Check if user is owner
    if (promoCode.sub === sub) {
        protectedValue = { value: promoCode.value };
    }

    const payment = await Payment.findOne({ sub, order: promoCode.id });

    if (payment) {
        protectedValue = { value: promoCode.value };
    }
    // Show if a Payment exists for the requesting user and this promo code
    // TokenRedeem.find({ promoCode: String(_id), sub: req.user.sub }) has a result

    return { ...{ id: String(promoCode._id), price: promoCode.price, expiry: promoCode.expiry }, ...protectedValue };
}

// page 1 and limit 10 are the default pagination start settings
async function listPromoCodesForSub(sub: string, page = 1, limit = 10) {
    return await paginatedResults(PromoCode, page, limit, { sub });
}

// Checks for allowance and balance to be sufficient and transfers
// promoCode price amount from token owner to spender address (pool owner)
async function transferTokens(
    assetPool: IAssetPool,
    owner: string,
    spender: string,
    price: number,
    npid: NetworkProvider,
) {
    const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
    const token = tokenContract(npid, tokenAddress);
    const amount = toWei(String(price));

    const balance = await callFunction(token.methods.balanceOf(owner), npid);
    if (balance < amount) {
        throw new InsufficientBalanceError();
    }

    const allowance = await callFunction(token.methods.allowance(owner, spender), npid);
    if (allowance < amount) {
        throw new AmountExceedsAllowanceError();
    }

    return await sendTransaction(token.options.address, token.methods.transferFrom(owner, spender, amount), npid);
}

export { createPromoCode, getPromoCodeById, listPromoCodesForSub, formatPromoCodeResponse, transferTokens };
