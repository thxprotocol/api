import { Request, Response } from 'express';
import { body } from 'express-validator';
import PromoCodeService from '@/services/PromoCodeService';

export const createPromoCodeValidation = [
    body('title').isString().isLength({ min: 0, max: 50 }),
    body('description').optional().isString().isLength({ min: 0, max: 255 }),
    body('value').isString().isLength({ min: 0, max: 50 }),
    body('price').isInt({ min: 0 }),
];

export default async function CreatePromoCodeController(req: Request, res: Response) {
    const { _id, title, description, value, price } = await PromoCodeService.create({
        sub: req.user.sub,
        title: req.body.title,
        description: req.body.description,
        value: req.body.value,
        price: req.body.price,
        poolAddress: req.assetPool.address,
    });

    res.status(201).json({
        id: String(_id),
        title,
        description,
        value,
        price,
    });
}
