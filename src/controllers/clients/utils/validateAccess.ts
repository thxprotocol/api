import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../../models/Error';
import { AssetPool } from '../../../models/AssetPool';

export async function validateClientAccess(req: HttpRequest, res: Response, next: NextFunction) {
    const pool = await AssetPool.findOne({ rat: req.params.rat });

    if (pool.sub !== req.user.sub) {
        return next(new HttpError(403, 'Could not access this client for your user.'));
    }
    next();
}
