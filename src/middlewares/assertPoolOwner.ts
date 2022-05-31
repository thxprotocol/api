import { Response, NextFunction, Request } from 'express';
import AssetPoolService from '@/services/AssetPoolService';
import { SubjectUnauthorizedError } from '@/util/errors';

export async function assertPoolOwner(
    req: Request & { user: { sub: string; aud: string } },
    res: Response,
    next: NextFunction,
) {
    const pool = await AssetPoolService.getById(req.params.id);
    if (pool.sub !== req.user.sub) throw new SubjectUnauthorizedError();
    req.assetPool = pool;
    next();
}
