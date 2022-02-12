import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { PromoCodeService } from './services/PromoCodeService';

import BaseController from './util/base';

// Name controllers by their CRUD operation (CreatePromoCodeController,
// ReadPromoCodeController, UpdatePromoCodeController,
// DeletePromoCodeController)
class CreatePromoCodeController extends BaseController {
    promoCodeService: PromoCodeService;

    // Maybe it makes sense to start properly constructing instances of services here?
    // Proper DI might improve this
    // Cache database responses in memory for performance reasons?
    constructor() {
        super();
        this.promoCodeService = new PromoCodeService();

        // Not used to having to do this, but thats probably the luxury frameworks
        // come with. A package like auto-bind might come in handy here.
        // https://www.npmjs.com/package/auto-bind
        this.validate = this.validate.bind(this);
        this.exec = this.exec.bind(this);
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

export default CreatePromoCodeController;
