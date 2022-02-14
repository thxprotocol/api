import { Request, Response } from 'express';
import { query } from 'express-validator';
import PromoCodeService from '../../services/PromoCodeService';

export const readAllPromoCodeValidation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

export default async function ReadPromoCodeController(req: Request, res: Response) {
    const results = [];
    const page = await PromoCodeService.findBySub(
        req.user.sub,
        Number(req.query.page), // Will default to 1 if undefined
        Number(req.query.limit), // Will default to 10 if undefined
    );

    for (const promoCode of page.results) {
        results.push(await PromoCodeService.formatResult(req.user.sub, promoCode));
    }

    page.results = results;

    res.json(page);
}
