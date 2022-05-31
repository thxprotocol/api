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
        const isMember = await AssetPoolService.isPoolMember(req.user.sub, address);
        const isOwner = await AssetPoolService.isPoolOwner(req.user.sub, address);

        if (!isMember && !isOwner) throw new SubjectUnauthorizedError();
        return next();
    }
    // If there is no sub check if client aud is equal to requested asset pool clientId
    // client_credentials grants make use of this flow since no subject is available.
    if (req.user.aud) {
        const isPoolClient = await AssetPoolService.isPoolClient(req.user.aud, address);
        if (!isPoolClient) throw new AudienceForbiddenError();
        return next();
    }
}
