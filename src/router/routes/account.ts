import express from 'express';
import * as accountController from '../../controllers/account';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/', accountController.getAccount);
router.patch('/', accountController.patchAccount);
router.delete('/', accountController.deleteAccount);
router.post('/password', validate.putPassword, accountController.putPassword);

export default router;
