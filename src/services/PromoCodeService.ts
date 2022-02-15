import { PromoCode, PromoCodeDocument } from '@/models/PromoCode';
import { IPromoCodeData } from '@/interfaces/IPromoCodeData';
import { paginatedResults } from '@/util/pagination';
import { Deposit } from '@/models/Deposit';
import { PromoCodeNotFoundError } from '@/util/errors';
import { DepositState } from '@/enums/DepositState';

async function create(data: IPromoCodeData) {
    return await PromoCode.create(data);
}

async function findById(id: string) {
    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
        throw new PromoCodeNotFoundError();
    }

    return promoCode;
}

async function formatResult(sub: string, promoCode: PromoCodeDocument) {
    let protectedValue;

    // Check if user is owner
    if (promoCode.sub === sub) {
        protectedValue = { value: promoCode.value };
    }

    // Check if user made a deposit
    const payment = await Deposit.findOne({ sub, item: promoCode.id, state: DepositState.Completed });
    if (payment) {
        protectedValue = { value: promoCode.value };
    }

    // Show if a Payment exists for the requesting user and this promo code
    // TokenRedeem.find({ promoCode: String(_id), sub: req.user.sub }) has a result
    return { ...{ id: String(promoCode._id), price: promoCode.price, expiry: promoCode.expiry }, ...protectedValue };
}

// page 1 and limit 10 are the default pagination start settings
async function findBySub(sub: string, page = 1, limit = 10) {
    return await paginatedResults(PromoCode, page, limit, { sub });
}

export default { create, findById, findBySub, formatResult };
