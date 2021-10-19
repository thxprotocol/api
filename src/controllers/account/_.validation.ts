import { isAddress } from 'ethers/lib/utils';
import { body, check } from 'express-validator';

export const validations = {
    postAccount: [
        body('email').exists(),
        body('password').exists(),
        body('address')
            .optional()
            .custom((value) => {
                return isAddress(value);
            }),
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
    ],
    postLogin: [
        body('email').exists(),
        body('email', 'Email is not valid').isEmail(),
        body('password').exists(),
        body('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
    ],
};
