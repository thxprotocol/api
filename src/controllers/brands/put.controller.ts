import { Request, Response } from 'express';
import { body } from 'express-validator';

import BrandService from '../../services/BrandService';

export default {
    validation: [body('logoImgUrl').optional().isURL(), body('backgroundImgUrl').optional().isURL()],
    controller: async (req: Request, res: Response) => {
        const brand = await BrandService.update({ poolId: req.assetPool._id }, req.body);
        res.json(brand);
    },
};
