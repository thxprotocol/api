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
    // withdrawal
    getWithdrawal: [validateAssetPoolHeader, param('address').exists()],
    getWithdrawals: [validateAssetPoolHeader, body('member').exists()],
    postWithdrawal: [
        validateAssetPoolHeader,
        check('amount', 'Request body should have amount').exists(),
        check('beneficiary', 'Request body should have beneficiary').exists(),
    ],
    // polls
    getPoll: [validateAssetPoolHeader, param('address').exists()],
    getVote: [validateAssetPoolHeader, param('agree').exists()],
    getRevokeVote: [validateAssetPoolHeader],
    postVote: [
        validateAssetPoolHeader,
        param('address').exists(),
        body('voter').exists(),
        body('agree').exists(),
        body('nonce').exists(),
        body('sig').exists(),
    ],
    deleteVote: [validateAssetPoolHeader],
    // members
    postMember: [validateAssetPoolHeader, body('address').exists()],
    deleteMember: [validateAssetPoolHeader, param('address').exists()],
    getMember: [validateAssetPoolHeader, param('address').exists()],
    // rewards
    postReward: [
        validateAssetPoolHeader,
        body('title').exists(),
        body('description').exists(),
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
    ],
    getReward: [validateAssetPoolHeader, param('id').exists()],
    getRewardUpdate: [
        validateAssetPoolHeader,
        body('withdrawAmount').exists(),
        body('withdrawDuration').exists(),
        body('title').exists(),
        body('description').exists(),
    ],
    getRewardClaim: [validateAssetPoolHeader, param('id').exists()],
    // asset_pools
    postAssetPools: [body('token').exists(), body('title').exists()],
    postAssetPoolDeposit: [validateAssetPoolHeader, body('amount').exists()],
    putAssetPool: [
        validateAssetPoolHeader,
        body('rewardPollDuration').exists(),
        body('proposeWithdrawPollDuration').exists(),
    ],
    getAssetPool: [validateAssetPoolHeader, param('address').exists()],
    // account
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
