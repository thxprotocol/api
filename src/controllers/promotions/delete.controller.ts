import { Request, Response } from 'express';
import { param } from 'express-validator';
import PromoCodeService from '@/services/PromoCodeService';

export const DeletePromoCodeValidation = [param('id').isString().isLength({ min: 24, max: 24 })];

export default async function DeletePromoCodeController(req: Request, res: Response) {
    // #swagger.tags = ['Promotions']
    await PromoCodeService.deleteById(req.params.id, req.user.sub);

    res.status(204).end();
}
