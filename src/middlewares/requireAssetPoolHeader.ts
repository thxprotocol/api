import { Response, Request, NextFunction } from 'express';
import { isAddress } from 'web3-utils';
import { BadRequestError } from '@/util/errors';
import AssetPoolService from '@/services/AssetPoolService';

export async function requireAssetPoolHeader(req: Request, _res: Response, next: NextFunction) {
    const address = req.header('AssetPool') || (await AssetPoolService.getById(req.params.id)).address;
    if (!address || !isAddress(address)) {
        throw new BadRequestError('Valid AssetPool header is required for this request.');
    }

    const assetPool = await AssetPoolService.getByAddress(address);
    if (!assetPool) {
        throw new BadRequestError('Asset Pool is not found in database.');
    }

    req.assetPool = assetPool;

    next();
}
