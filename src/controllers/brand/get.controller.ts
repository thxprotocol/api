import { Request, Response } from 'express';
import BrandService from '@/services/BrandService';

const FALLBACK_URL = { logoImgUrl: '', backgroundImgUrl: '' };

const getBrandByPool = async (req: Request, res: Response) => {
    const poolAddress = req.params['pool_address'];
    const brand = await BrandService.get(poolAddress);
    const data = brand?.toJSON();
    if (!data) res.status(200).send(FALLBACK_URL);
    res.send(data);
};

export default {
    controller: getBrandByPool,
};
