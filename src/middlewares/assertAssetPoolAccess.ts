import { Response, Request, NextFunction } from 'express';
import AssetPoolService from '@/services/AssetPoolService';
import { SubjectUnauthorizedError, AudienceForbiddenError } from '@/util/errors';

export async function assertAssetPoolAccess(
    req: Request & { user: { sub: string; aud: string } },
    res: Response,
    next: NextFunction,
) {
    const address = req.header('X-PoolAddress') || (await AssetPoolService.getById(req.params.id)).address;

    // If there is a sub check the account for user membership
    if (req.user.sub) {
        const isMember = await AssetPoolService.isAssetPoolMember(req.user.sub, address);
        if (!isMember) throw new SubjectUnauthorizedError();
        return next();
    }
    // If there is no sub check if client aud is equal to requested asset pool clientId
    // client_credentials grants make use of this flow since no subject is available.
    if (req.user.aud) {
        const assetPools = await AssetPoolService.getByClientIdAndAddress(req.user.aud, address);
        if (!assetPools) throw new AudienceForbiddenError();
        return next();
    }
}
