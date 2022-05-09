import { Request, Response } from 'express';
import { query } from 'express-validator';
import PromotionService from '@/services/PromotionService';

const validation = [query('limit').optional().isNumeric(), query('page').optional().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Promotions']
    const results = [];
    const page = await PromotionService.findByQuery(
        { poolAddress: req.assetPool.address },
        req.query.page ? Number(req.query.page) : null, // Will default to 1 if undefined
        req.query.limit ? Number(req.query.limit) : null, // Will default to 10 if undefined
    );

    for (const promoCode of page.results) {
        results.push(await PromotionService.formatResult(req.user.sub, promoCode));
    }

    page.results = results;

    res.json(page);
};

export default { controller, validation };
