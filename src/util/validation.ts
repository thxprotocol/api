import { AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { body, check, header, param, validationResult } from 'express-validator';

export const handleValidation = (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array());
    }
};

const validateRewardPoolHeader = header('RewardPool')
    .exists()
    .custom((address, { req }) => {
        if (!(req.user as AccountDocument).profile.rewardPools.includes(address)) {
            throw new Error('Access for this reward pool is not allowed.');
        }
        return true;
    });

const confirmPassword = body('confirmPassword')
    .exists()
    .custom((confirmPassword, { req }) => {
        if (confirmPassword === req.body.password) {
            throw new Error('Access for this reward pool is not allowed.');
        }
        return true;
    });

export const validate = {
    getReward: [validateRewardPoolHeader],
    postRewardRule: [validateRewardPoolHeader, body('title').exists(), body('amount').exists()],
    getRewardRule: [validateRewardPoolHeader, param('id').exists()],
    getRewardRuleClaim: [validateRewardPoolHeader, param('id').exists()],
    postRewardPools: [body('token').exists(), body('title').exists()],
    postRewardPoolDeposit: [body('amount').exists()],
    getRewardPools: [validateRewardPoolHeader],
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
    postUpdateProfile: [check('email', 'Please enter a valid email address.').isEmail()],
};
