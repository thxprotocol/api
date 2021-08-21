import { body, validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../models/Error';
import { Account } from '../models/Account';
import { AssetPool } from '../models/AssetPool';

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

export const validateAssetPoolHeader = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        // If there is a sub check the account for user membership
        if (req.user.sub) {
            const account = await Account.findById(req.user.sub);

            if (req.user.scope.includes('widget')) {
                return next();
            }

            if (!account.memberships || account.memberships.indexOf(req.header('AssetPool')) === -1) {
                throw new HttpError(401, 'Could not access this asset pool by sub.');
            }
        }
        // If there is no sub check if client aud is equal to requested asset pool aud
        else if (req.user.aud) {
            const assetPools = await AssetPool.find({ aud: req.user.aud, address: req.header('AssetPool') });

            if (!assetPools) {
                throw new HttpError(401, 'Could not access this asset pool by audience.');
            }
        }

        next();
    } catch (e) {
        next(e);
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
