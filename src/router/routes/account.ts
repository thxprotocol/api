import express from 'express';
import * as accountController from '../../controllers/account';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/', accountController.getAccount);
router.post('/profile', accountController.postUpdateProfile);
router.post('/password', validate.postUpdatePassword, accountController.postUpdatePassword);
router.delete('/', accountController.deleteAccount);

export default router;
