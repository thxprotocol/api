import { ethers } from 'ethers';
import { body, check } from 'express-validator';
import { confirmPassword } from '@/util/validation';

export const validations = {
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
    postAuthenticationToken: [
        body('email').exists(),
        body('email', 'Email is not valid').isEmail(),
        body('password').exists(),
        body('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
    ],
};
