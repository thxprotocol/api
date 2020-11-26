import { AccountDocument } from '../models/Account';
import { body, check, header, param, validationResult } from 'express-validator';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../models/Error';
import { ethers } from 'ethers';

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

const validateAssetPoolHeader = header('AssetPool')
    .exists()
    .custom((address, { req }) => {
        if (!(req.user as AccountDocument).profile.assetPools.includes(address)) {
            throw new HttpError(403, 'Access for this reward pool is not allowed.');
        }
        return true;
    });

const confirmPassword = body('confirmPassword')
    .exists()
    .custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
            throw new HttpError(400, 'Passwords are not identical');
        }
        return true;
    });

export const validations = {
    // withdrawal
    getWithdrawal: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getWithdrawals: [
        validateAssetPoolHeader,
        body('member')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    postWithdrawal: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    getWithdrawalWithdraw: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    postWithdrawalWithdraw: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    // polls
    getPoll: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getVote: [validateAssetPoolHeader, param('agree').exists()],
    getRevokeVote: [validateAssetPoolHeader],
    postVote: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    deleteVote: [validateAssetPoolHeader],
    postPollFinalize: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    // members
    postMember: [
        validateAssetPoolHeader,
        body('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    patchMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('isManager').exists(),
    ],
    deleteMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    getMember: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    // rewards
    postReward: [
        validateAssetPoolHeader,
        body('title').exists(),
        body('description').exists(),
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
    ],
    getReward: [validateAssetPoolHeader, param('id').exists().isNumeric()],
    patchReward: [validateAssetPoolHeader],
    putReward: [
        validateAssetPoolHeader,
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
        body('title').exists(),
        body('description').exists(),
    ],
    getRewardClaim: [validateAssetPoolHeader, param('id').exists()],
    postRewardClaim: [
        validateAssetPoolHeader,
        param('id').exists(),
        body('call').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    // asset_pools
    postAssetPools: [
        body('token')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        ,
        body('title').exists(),
    ],
    postAssetPoolDeposit: [validateAssetPoolHeader, body('amount').exists()],
    patchAssetPool: [
        validateAssetPoolHeader,
        body('rewardPollDuration').optional().isNumeric(),
        body('proposeWithdrawPollDuration').optional().isNumeric(),
    ],
    getAssetPool: [
        validateAssetPoolHeader,
        param('address')
            .exists()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
    ],
    // account
    postSignup: [
        body('email').exists(),
        body('password').exists(),
        body('confirmPassword').exists(),
        body('address')
            .optional()
            .custom((value) => {
                return ethers.utils.isAddress(value);
            }),
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
    putPassword: [
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
    postReset: [
        check('password', 'Password must be at least 4 characters long.').isLength({ min: 4 }),
        confirmPassword,
    ],
    postLogin: [
        body('email').exists(),
        body('password').exists(),
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password cannot be blank').isLength({ min: 1 }),
    ],
    postForgot: [check('email').exists(), check('email', 'Email is not valid').isEmail()],
};
