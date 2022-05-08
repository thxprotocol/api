import { Request, Response } from 'express';
import { query } from 'express-validator';
import PromoCodeService from '@/services/PromoCodeService';

export const readAllPromoCodeValidation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

export default async function ReadPromoCodeController(req: Request, res: Response) {
    // #swagger.tags = ['Promotions']
    const results = [];
    const page = await PromoCodeService.findByQuery(
        { poolAddress: req.assetPool.address },
        req.query.page ? Number(req.query.page) : null, // Will default to 1 if undefined
        req.query.limit ? Number(req.query.limit) : null, // Will default to 10 if undefined
    );

    for (const promoCode of page.results) {
        results.push(await PromoCodeService.formatResult(req.user.sub, promoCode));
    }

    page.results = results;

    res.json(page);
}
