import { body, validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../models/Error';
import { Account, AccountDocument } from '../models/Account';
import { Client } from '../models/Client';

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
        let assetPools;

        if (req.user.sub) {
            const account: AccountDocument = await Account.findById(req.user.sub);

            assetPools = account.memberships;
        } else if (req.user.aud) {
            const client = await Client.findById(req.user.aud);
            assetPools = client.assetPools;
        }

        if (!assetPools || assetPools.indexOf(req.header('AssetPool')) === -1) {
            throw new HttpError(403, 'You can not access this asset pool.');
        }

        next();
    } catch (e) {
        console.log(e);
        next(e);
    }
};

export const validateRegistrationToken = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const account = await Account.findById(req.user.sub);

        if (account.registrationAccessTokens && account.registrationAccessTokens.indexOf(req.params.rat) === -1) {
            throw new HttpError(403, 'You can not access this registration_access_token.');
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
