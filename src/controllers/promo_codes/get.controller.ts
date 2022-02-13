import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { getPromoCodeById } from '../../services/PromoCodeService';

const readPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

async function ReadPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { _id, value, price, expiry } = await getPromoCodeById(req.params.id);

    res.json({ id: String(_id), price, value, expiry });
}

export { readPromoCodeValidation };
export default ReadPromoCodeController;
