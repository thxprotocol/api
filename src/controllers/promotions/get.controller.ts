import { Request, Response } from 'express';
import { param } from 'express-validator';
import PromotionService from '@/services/PromotionService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Promotions']
    const promoCode = await PromotionService.findById(req.params.id);
    const result = await PromotionService.formatResult(req.user.sub, promoCode);

    res.json(result);
};

export default { controller, validation };
