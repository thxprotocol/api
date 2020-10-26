import express from 'express';
import * as withdrawalController from '../../controllers/withdrawal';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/', validate.getWithdrawals, withdrawalController.getWithdrawals);
router.get('/:address', validate.getWithdrawal, withdrawalController.getWithdrawal);
router.post('/', validate.postWithdrawal, withdrawalController.postWithdrawal);
router.get('/:address/withdraw', validate.getWithdrawalWithdraw, withdrawalController.getWithdrawalWithdraw);
router.post('/:address/withdraw', validate.postWithdrawalWithdraw, withdrawalController.postWithdrawalWithdraw);

export default router;
