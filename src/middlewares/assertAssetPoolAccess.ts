import { Response, Request, NextFunction } from 'express';
import AssetPoolService from '@/services/AssetPoolService';
import { SubjectUnauthorizedError, AudienceForbiddenError } from '@/util/errors';

export async function assertAssetPoolAccess(
    req: Request & { user: { sub: string; aud: string } },
    res: Response,
    next: NextFunction,
) {
    // If there is a sub check the account for user membership
    if (req.user.sub) {
        const isMember = await AssetPoolService.isAssetPoolMember(req.user.sub, req.header('AssetPool'));
        const poolAddresses = await AssetPoolService.getAllBySub(req.user.sub);

        if (!isMember && !poolAddresses.includes(req.header('AssetPool'))) {
            throw new SubjectUnauthorizedError();
        }

        return next();
    }
    // If there is no sub check if client aud is equal to requested asset pool clientId
    // client_credentials grants make use of this flow since no subject is available.
    if (req.user.aud) {
        const assetPools = await AssetPoolService.getByClientIdAndAddress(req.user.aud, req.header('AssetPool'));

        if (!assetPools) {
            throw new AudienceForbiddenError();
        }

        return next();
    }
}
