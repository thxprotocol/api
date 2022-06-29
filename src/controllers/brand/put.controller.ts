import { Request, Response } from 'express';
import { body } from 'express-validator';

import BrandService from '../../services/BrandService';

const validation = [body('logoImgUrl').exists().isString(), body('backgroundImgUrl').exists().isString()];

const patchBrandByPool = async (req: Request, res: Response) => {
    const poolAddress = req.params['pool_address'];
    const updatedBrand = await BrandService.update({ poolAddress }, req.body);
    res.send(updatedBrand.toJSON());
};

export default {
    controller: patchBrandByPool,
    validation: validation,
};
