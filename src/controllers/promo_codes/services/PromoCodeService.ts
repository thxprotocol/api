import { PromoCode } from '../models/PromoCode';
import { IPromoCodeData } from '../interfaces/IPromoCode';

class PromoCodeService {
    async create(data: IPromoCodeData) {
        return await PromoCode.create(data);
    }
}

export { PromoCodeService };
