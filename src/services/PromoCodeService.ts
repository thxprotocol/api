import { PromoCode } from '../models/PromoCode';
import { IPromoCodeData } from '../interfaces/IPromoCodeData';
import { paginatedResults } from '../util/pagination';
import { PromoCodeNotFoundError } from '../util/errors';

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

export { createPromoCode, getPromoCodeById, listPromoCodesForSub };
