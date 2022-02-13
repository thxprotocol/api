import { Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { PromoCodeDocument } from '../../models/PromoCode';
import { listPromoCodesForSub } from '../../services/PromoCodeService';

const readAllPromoCodeValidation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

async function ReadPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const page = await listPromoCodesForSub(
        req.user.sub,
        Number(req.query.page), // Will default to 1 if undefined
        Number(req.query.limit), // Will default to 10 if undefined
    );

    // Formatting the response is the controller and not the service responsibility imo
    page.results = page.results.map((p: PromoCodeDocument) => {
        return {
            id: String(p._id),
            price: p.price,
            value: p.value,
            expiry: p.expiry,
        };
    });

    res.json(page);
}

export { readAllPromoCodeValidation };
export default ReadPromoCodeController;
