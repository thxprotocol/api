import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { PromoCodeService } from './services/PromoCodeService';

import BaseController from './util/base';

// Name controllers by their CRUD operation (CreatePromoCodeController,
// ReadPromoCodeController, UpdatePromoCodeController,
// DeletePromoCodeController)
export class CreatePromoCodeController extends BaseController {
    promoCodeService: PromoCodeService;

    // Maybe it makes sense to start properly constructing instances of services here?
    // Proper DI might improve this
    // Cache database responses in memory for performance reasons?
    constructor() {
        super();
        this.promoCodeService = new PromoCodeService();
    }

    // Moving validation into the controller class will help understand what
    // type of inputs to expect in the implementation
    validate(req: Request, res: Response, next: NextFunction) {
        this.validateInput(req, res, next, [body('expiry').exists(), body('value').exists()]);
    }

    // Default controller executed method.
    async exec(req: Request, res: Response) {
        const promoCode = await this.promoCodeService.create({
            value: req.body.value,
            expiry: req.body.expiry,
        });
        res.json(promoCode);
    }
}
