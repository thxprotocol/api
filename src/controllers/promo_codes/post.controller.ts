import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { createPromoCode } from '../../services/PromoCodeService';

const createPromoCodeValidation = [body('expiry').isNumeric(), body('price').isNumeric(), body('value').isString()];

async function CreatePromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { _id, value, price, expiry } = await createPromoCode({
        sub: req.user.sub,
        price: req.body.price,
        value: req.body.value,
        expiry: req.body.expiry,
    });
    res.status(201).json({
        id: String(_id),
        price,
        value,
        expiry,
    });
}

export { createPromoCodeValidation };
export default CreatePromoCodeController;
