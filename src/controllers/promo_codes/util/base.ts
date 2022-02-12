// deps
import { Response, Request, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { isAddress } from 'web3-utils';
// modals (should actually only exist on service level)
import { AssetPool } from '../../../models/AssetPool';
// services
import AssetPoolService from '../../../services/AssetPoolService';
// utils
import { UnauthorizedError, ForbiddenError, NotFoundError } from './errors';

class BaseController {
    async validateHeader(req: Request, res: Response, next: NextFunction) {
        // If there is a sub check the account for user membership
        if (req.user.sub) {
            const { result, error } = await AssetPoolService.checkAssetPoolAccess(
                req.user.sub,
                req.header('AssetPool'),
            );

            if (!result || error) {
                throw new UnauthorizedError('The subject of this access is not authorized to access this asset pool.');
            } else {
                return next();
            }
        }
        // If there is no sub check if client aud is equal to requested asset pool clientId
        // client_credentials grants make use of this flow since no subject is available.
        if (req.user.aud) {
            const assetPools = await AssetPoolService.getByClientIdAndAddress(req.user.aud, req.header('AssetPool'));

            if (!assetPools) {
                throw new ForbiddenError(
                    'Access to this asset pool is forbidden for the audience in the access token.',
                );
            } else {
                return next();
            }
        }
    }

    async validateInput(req: Request, res: Response, next: NextFunction, validations: any[]) {
        await Promise.all(validations.map((validation: any) => validation.run(req)));

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ errors: errors.array() });
    }

    async parseHeader(req: Request, res: Response, next: NextFunction) {
        const address = req.header('AssetPool');

        if (address && isAddress(address)) {
            const { assetPool } = await AssetPoolService.getByAddress(address);

            if (!assetPool) {
                throw new NotFoundError('Asset Pool is not found in database.');
            }

            req.assetPool = assetPool;
            next();
        } else {
            throw new ForbiddenError('Valid AssetPool header is required for this request.');
        }
    }
}

export default BaseController;
