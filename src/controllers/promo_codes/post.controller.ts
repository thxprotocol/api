import { Request, Response } from 'express';
import { body } from 'express-validator';
import PromoCodeService from '@/services/PromoCodeService';

export const createPromoCodeValidation = [
    body('expiry').isNumeric(),
    body('price').isNumeric(),
    body('value').isString(),
];

export default async function CreatePromoCodeController(req: Request, res: Response) {
    const { _id, value, price, expiry } = await PromoCodeService.create({
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
