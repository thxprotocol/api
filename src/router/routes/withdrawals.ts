import express from 'express';
import * as withdrawalController from '../../controllers/withdrawal';
import { validations, validate } from '../../util/validation';

const router = express.Router();

router.get('/', validate(validations.getWithdrawals), withdrawalController.getWithdrawals);
router.get('/:address', validate(validations.getWithdrawal), withdrawalController.getWithdrawal);
router.post('/', validate(validations.postWithdrawal), withdrawalController.postWithdrawal);
router.get(
    '/:address/withdraw',
    validate(validations.getWithdrawalWithdraw),
    withdrawalController.getWithdrawalWithdraw,
);
router.post(
    '/:address/withdraw',
    validate(validations.postWithdrawalWithdraw),
    withdrawalController.postWithdrawalWithdraw,
);

export default router;
