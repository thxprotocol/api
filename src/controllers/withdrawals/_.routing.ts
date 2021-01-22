import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { postWithdrawalWithdraw } from './postWithdrawalWithdraw.action';
import { parseHeader } from '../../util/network';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.get('/', checkScopes(['admin', 'user']), validate(validations.getWithdrawals), parseHeader, getWithdrawals);
router.get('/:id', checkScopes(['admin', 'user']), validate(validations.getWithdrawal), parseHeader, getWithdrawal);
router.post(
    '/:id/withdraw',
    checkScopes(['admin']),
    validate(validations.postWithdrawalWithdraw),
    parseHeader,
    postWithdrawalWithdraw,
);

export default router;
