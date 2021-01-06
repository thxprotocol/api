import { body, header, validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../models/Error';
import MongoAdapter from '../oidc/adapter';

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

export const validateAssetPoolHeader = header('AssetPool')
    .exists()
    .custom(async (address, { req }) => {
        const Client = new MongoAdapter('client');
        const payload = await Client.find(req.user.aud);

        if (!payload.assetPools || !payload.assetPools.includes(address)) {
            throw new HttpError(403, 'Forbidden to access this asset pool.');
        }
        return true;
    });

export const confirmPassword = body('confirmPassword')
    .exists()
    .custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
            throw new HttpError(400, 'Passwords are not identical');
        }
        return true;
    });
