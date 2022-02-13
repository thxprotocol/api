// deps
import { Response, Request, NextFunction } from 'express';
import { isAddress } from 'web3-utils';
import { IAssetPool } from '../models/AssetPool';
import AssetPoolService from '../services/AssetPoolService';
import { ForbiddenError, NotFoundError } from '../util/errors';

export async function requireAssetPoolHeader(
    req: Request & { assetPool: IAssetPool },
    res: Response,
    next: NextFunction,
) {
    const address = req.header('AssetPool');

    if (!address || !isAddress(address)) {
        next(new ForbiddenError('Valid AssetPool header is required for this request.'));
    }

    const { assetPool } = await AssetPoolService.getByAddress(address);

    if (!assetPool) {
        next(new NotFoundError('Asset Pool is not found in database.'));
    }

    req.assetPool = assetPool;

    next();
}
