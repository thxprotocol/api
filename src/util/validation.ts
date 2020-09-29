import { AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { body, check, header, param, validationResult } from 'express-validator';

export const handleValidation = (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array());
    }
};

const validateAssetPoolHeader = header('AssetPool')
    .exists()
    .custom((address, { req }) => {
        if (!(req.user as AccountDocument).profile.assetPools.includes(address)) {
            throw new Error('Access for this reward pool is not allowed.');
        }
        return true;
    });

const confirmPassword = body('confirmPassword')
    .exists()
    .custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
            throw new Error('Passwords are not the same.');
        }
        return true;
    });

export const validate = {
    getWithdrawal: [validateAssetPoolHeader, param('address').exists()],
    getWithdrawals: [validateAssetPoolHeader, body('member').exists()],
    postWithdrawal: [
        validateAssetPoolHeader,
        check('amount', 'Request body should have amount').exists(),
        check('beneficiary', 'Request body should have beneficiary').exists(),
    ],
    getWithdrawalVote: [validateAssetPoolHeader, param('agree').exists()],
    postWithdrawalVote: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('voter').exists(),
        body('agree').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    postMember: [validateAssetPoolHeader, body('address').exists()],
    deleteMember: [validateAssetPoolHeader, param('address').exists()],
    getMember: [validateAssetPoolHeader, param('address').exists()],
    postReward: [validateAssetPoolHeader, body('title').exists(), body('amount').exists()],
    getReward: [validateAssetPoolHeader, param('id').exists()],
    getRewardClaim: [validateAssetPoolHeader, param('id').exists()],
    postAssetPools: [body('token').exists(), body('title').exists()],
    postAssetPoolDeposit: [body('amount').exists()],
    getAssetPools: [validateAssetPoolHeader],
    postSignup: [
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
    postUpdatePassword: [
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
    postReset: [
        check('password', 'Password must be at least 4 characters long.').isLength({ min: 4 }),
        confirmPassword,
    ],
    postLogin: [
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password cannot be blank').isLength({ min: 1 }),
    ],
};
