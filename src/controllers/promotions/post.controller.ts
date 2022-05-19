import { Request, Response } from 'express';
import { body } from 'express-validator';
import PromotionService from '@/services/PromotionService';

export const validation = [
    body('title').isString().isLength({ min: 0, max: 50 }),
    body('description').optional().isString().isLength({ min: 0, max: 255 }),
    body('value').isString().isLength({ min: 0, max: 50 }),
    body('price').isInt({ min: 0 }),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Promotions']
    const { _id, title, description, value, price } = await PromotionService.create({
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
};

export default { controller, validation };
