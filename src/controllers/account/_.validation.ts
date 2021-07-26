import { body, check } from 'express-validator';
import { confirmPassword } from '@/util/validation';

export const validations = {
    putPassword: [
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
    postAccount: [
        body('email').exists(),
        body('password').exists(),
        body('confirmPassword').exists(),
        check('email', 'Email is not valid').isEmail(),
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
};
