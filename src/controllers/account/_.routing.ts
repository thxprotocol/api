import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { putPassword } from './putPassword.action';

const router = express.Router();

router.get('/', getAccount);
router.patch('/', patchAccount);
router.delete('/', deleteAccount);
router.post('/password', validate(validations.putPassword), putPassword);

export default router;
