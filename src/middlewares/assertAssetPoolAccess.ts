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
    if (req.auth.sub) {
        const hasMembership = await AssetPoolService.isPoolMember(req.auth.sub, address);
        const isOwner = await AssetPoolService.isPoolOwner(req.auth.sub, address);

        if (!hasMembership && !isOwner) throw new SubjectUnauthorizedError();
        return next();
    }
    // If there is no sub check if client aud is equal to requested asset pool clientId
    // client_credentials grants make use of this flow since no subject is available.
    if (req.auth.aud) {
        const isPoolClient = await AssetPoolService.isPoolClient(req.auth.aud, address);
        if (!isPoolClient) throw new AudienceForbiddenError();
        return next();
    }
}
