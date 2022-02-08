import { body, validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../models/Error';
import { AssetPool } from '../models/AssetPool';
import AssetPoolService from '../services/AssetPoolService';

export const validate = (validations: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map((validation: any) => validation.run(req)));

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ errors: errors.array() });
    };
};

export const validateAssetPoolHeader = async (req: Request, res: Response, next: NextFunction) => {
    // If there is a sub check the account for user membership
    if (req.user.sub) {
        if (req.user.scope.includes('widget')) {
            return next();
        }
        const { result, error } = await AssetPoolService.checkAssetPoolAccess(req.user.sub, req.header('AssetPool'));

        if (!result || error) {
            return next(new HttpError(401, 'Could not access this asset pool by sub.'));
        } else {
            return next();
        }
    }
    // If there is no sub check if client aud is equal to requested asset pool aud
    if (req.user.aud) {
        const assetPools = await AssetPool.find({ clientId: req.user.aud, address: req.header('AssetPool') });

        if (!assetPools) {
            return next(new HttpError(401, 'Could not access this asset pool by audience.'));
        } else {
            return next();
        }
    }
};

export const confirmPassword = body('confirmPassword')
    .exists()
    .custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
            throw new HttpError(400, 'Passwords are not identical');
        }
        return true;
    });
