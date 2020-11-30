import express from 'express';
import { confirmPassword, validate } from '../../util/validation';
import { check } from 'express-validator';

import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { putPassword } from './putPassword.action';

const router = express.Router();

router.get('/', getAccount);
router.patch('/', patchAccount);
router.delete('/', deleteAccount);
router.post(
    '/password',
    validate([check('password', 'Password must be at least 4 characters long').isLength({ min: 4 }), confirmPassword]),
    putPassword,
);

export default router;
