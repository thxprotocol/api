import { check } from 'express-validator';
import { confirmPassword, validateAssetPoolHeader } from '../../util/validation';

export const validations = {
    getAccountNonce: [validateAssetPoolHeader],
    putPassword: [
        check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }),
        confirmPassword,
    ],
};
