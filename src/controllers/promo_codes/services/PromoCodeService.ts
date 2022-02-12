import { PromoCode } from '../models/PromoCode';

interface IPromoCodeData {
    value: string;
    expiry: Date;
}

class PromoCodeService {
    async create(data: IPromoCodeData) {
        return await PromoCode.create(data);
    }
}

export { PromoCodeService };
