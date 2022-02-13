import { Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { listPromoCodesForSub, formatPromoCodeResponse } from '../../services/PromoCodeService';

export const readAllPromoCodeValidation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

export default async function ReadPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const results = [];
    const page = await listPromoCodesForSub(
        req.user.sub,
        Number(req.query.page), // Will default to 1 if undefined
        Number(req.query.limit), // Will default to 10 if undefined
    );

    for (const promoCode of page.results) {
        results.push(await formatPromoCodeResponse(req.user.sub, promoCode));
    }

    page.results = results;

    res.json(page);
}
