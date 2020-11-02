import { AccountDocument } from '../models/Account';
import { body, check, header, param } from 'express-validator';

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
    postWithdrawal: [validateAssetPoolHeader, body('call').exists(), body('nonce').exists(), body('sig').exists()],
    getWithdrawalWithdraw: [validateAssetPoolHeader, param('address').exists()],
    postWithdrawalWithdraw: [validateAssetPoolHeader, param('address').exists()],
    // polls
    getPoll: [validateAssetPoolHeader, param('address').exists()],
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
    postMember: [validateAssetPoolHeader, body('address').exists()],
    patchMember: [validateAssetPoolHeader, body('address').exists()],
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
    postAssetPools: [body('token').exists(), body('title').exists()],
    postAssetPoolDeposit: [validateAssetPoolHeader, body('amount').exists()],
    patchAssetPool: [validateAssetPoolHeader],
    getAssetPool: [validateAssetPoolHeader, param('address').exists()],
    // account
    postSignup: [
        body('email').exists(),
        body('password').exists(),
        body('confirmPassword').exists(),
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
