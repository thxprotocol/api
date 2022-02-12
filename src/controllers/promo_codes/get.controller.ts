import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { PromoCodeService } from './services/PromoCodeService';

import BaseController from './util/base';

class CreatePromoCodeController extends BaseController {
    promoCodeService: PromoCodeService;

    constructor() {
        super();
        this.promoCodeService = new PromoCodeService();
        this.validate = this.validate.bind(this);
        this.exec = this.exec.bind(this);
    }

    validate(req: Request, res: Response, next: NextFunction) {
        const validation = [body('expiry').exists(), body('value').exists()];

        this.validateInput(req, res, next, validation);
    }

    async exec(req: Request, res: Response) {
        const promoCode = await this.promoCodeService.create({
            value: req.body.value,
            expiry: req.body.expiry,
        });
        res.status(201).json(promoCode);
    }
}

export default CreatePromoCodeController;
