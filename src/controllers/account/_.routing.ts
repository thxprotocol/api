import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { putPassword } from './putPassword.action';
import checkScopes from 'express-jwt-authz';
import { getAccountNonce } from './getNonce.action';
import { parseHeader } from '../../util/network';

const router = express.Router();

router.get('/', checkScopes(['user']), getAccount);
router.get('/nonce', checkScopes(['user']), validate(validations.getAccountNonce), parseHeader, getAccountNonce);
router.patch('/', checkScopes(['user']), patchAccount);
router.delete('/', checkScopes(['user']), deleteAccount);
router.put('/password', checkScopes(['user']), validate(validations.putPassword), putPassword);

export default router;
