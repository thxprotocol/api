import express from 'express';
import * as withdrawalController from '../../controllers/withdrawal';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/', validate.getWithdrawals, withdrawalController.getWithdrawals);
router.get('/:address', validate.getWithdrawal, withdrawalController.getWithdrawal);
router.post('/', validate.postWithdrawal, withdrawalController.postWithdrawal);
// TODO router.get('/withdrawals/:address/withdraw', validate.getWithdraw, withdrawalController.getWithdraw);
// TODO router.post('/withdrawals/:address/withdraw', validate.postWithdraw, withdrawalController.postWithdraw);

export default router;
