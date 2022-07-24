import { Request, Response } from 'express';
import { body } from 'express-validator';

import BrandService from '../../services/BrandService';

export default {
    validation: [body('logoImgUrl').exists().isURL(), body('backgroundImgUrl').exists().isURL()],
    controller: async (req: Request, res: Response) => {
        const brand = await BrandService.update({ poolId: req.params.poolId }, req.body);
        res.json(brand);
    },
};
