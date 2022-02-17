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
        const { result, error } = await AssetPoolService.checkAssetPoolAccess(req.user.sub, req.header('AssetPool'));

        if (!result || error) {
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
