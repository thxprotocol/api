import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { postWithdrawalWithdraw } from './postWithdrawalWithdraw.action';

const router = express.Router();

router.get('/', validate(validations.getWithdrawals), getWithdrawals);
router.get('/:address', validate(validations.getWithdrawal), getWithdrawal);
router.post('/:address/withdraw', validate(validations.postWithdrawalWithdraw), postWithdrawalWithdraw);

export default router;
