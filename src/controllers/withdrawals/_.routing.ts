import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { postWithdrawalWithdraw } from './postWithdrawalWithdraw.action';
import { parseHeader } from '../../util/network';

const router = express.Router();

router.get('/', validate(validations.getWithdrawals), parseHeader, getWithdrawals);
router.get('/:address', validate(validations.getWithdrawal), parseHeader, getWithdrawal);
router.post('/:address/withdraw', validate(validations.postWithdrawalWithdraw), parseHeader, postWithdrawalWithdraw);

export default router;
