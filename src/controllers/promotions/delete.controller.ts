import { Request, Response } from 'express';
import { param } from 'express-validator';
import PromotionService from '@/services/PromotionService';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Promotions']
    await PromotionService.deleteById(req.params.id, req.user.sub);

    res.status(204).end();
};

export default { controller, validation };
