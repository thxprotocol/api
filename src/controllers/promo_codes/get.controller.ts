import { Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { getPromoCodeById } from '../../services/PromoCodeService';

const readPromoCodeValidation = [param('id').isString().isLength({ min: 23, max: 25 })];

async function ReadPromoCodeController(req: Request, res: Response, next: NextFunction) {
    const { _id, sub, value, price, expiry } = await getPromoCodeById(req.params.id);
    let protectedValue = {};

    console.log(req.user);

    // Show if requesting user owns the code
    if (sub === req.user.sub) {
        protectedValue = { value };
    }

    // Show if a TokenRedeem exists for the requesting user and this code
    // TokenRedeem.find({ promoCode: String(_id), sub: req.user.sub }) has a result

    res.json({ ...{ id: String(_id), price, expiry }, ...protectedValue });
}

export { readPromoCodeValidation };
export default ReadPromoCodeController;
