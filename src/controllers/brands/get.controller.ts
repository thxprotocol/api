import { Request, Response } from 'express';
import BrandService from '@/services/BrandService';
import { NotFoundError } from '@/util/errors';

export default {
    controller: async (req: Request, res: Response) => {
        const brand = await BrandService.get(req.params.poolId);
        if (!brand) throw new NotFoundError('Brand not found');
        res.json(brand);
    },
};
