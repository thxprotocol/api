import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { formatPromoCodeResponse, getPromoCodeById } from '../../services/PromoCodeService';

export const readPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

export default async function ReadPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const promoCode = await getPromoCodeById(req.params.id);
    const result = await formatPromoCodeResponse(req.user.sub, promoCode);

    res.json(result);
}
