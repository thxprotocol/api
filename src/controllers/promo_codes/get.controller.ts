import { Request, Response } from 'express';
import { param } from 'express-validator';
import PromoCodeService from '../../services/PromoCodeService';

export const readPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

export default async function ReadPromoCodeController(req: Request, res: Response) {
    const promoCode = await PromoCodeService.findById(req.params.id);
    const result = await PromoCodeService.formatResult(req.user.sub, promoCode);

    res.json(result);
}
