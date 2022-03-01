import { PromoCode, PromoCodeDocument } from '@/models/PromoCode';
import { paginatedResults } from '@/util/pagination';
import { Deposit } from '@/models/Deposit';
import { ForbiddenError, PromoCodeNotFoundError } from '@/util/errors';
import { DepositState } from '@/types/enums/DepositState';
import { TPromoCode } from '@/types/TPromoCode';

async function create(data: TPromoCode) {
    return await PromoCode.create(data);
}

async function deleteById(id: string, sub: string) {
    const promoCode = await findById(id);

    if (promoCode.sub !== sub) {
        throw new ForbiddenError();
    }

    return await promoCode.remove();
}

async function findById(id: string) {
    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
        throw new PromoCodeNotFoundError();
    }

    return promoCode;
}

async function formatResult(sub: string, promoCode: PromoCodeDocument) {
    // Check if user is owner
    const isOwner = promoCode.sub === sub;
    // Check if user made a deposit
    const deposit = await Deposit.findOne({ sub, item: promoCode.id, state: DepositState.Completed });

    const id = String(promoCode._id);
    const value = isOwner || deposit ? promoCode.value : '';

    return {
        id,
        title: promoCode.title,
        description: promoCode.description,
        price: promoCode.price,
        value,
    };
}

// page 1 and limit 10 are the default pagination start settings
function findBySub(sub: string, page = 1, limit = 10) {
    return paginatedResults(PromoCode, page, limit, { sub });
}

export default { create, deleteById, findById, findBySub, formatResult };
