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
import { postAccount } from './post.action';

const router = express.Router();

router.get('/', checkScopes(['user', 'dashboard']), getAccount);
router.get(
    '/nonce',
    checkScopes(['user', 'dashboard']),
    validate(validations.getAccountNonce),
    parseHeader,
    getAccountNonce,
);
router.patch('/', checkScopes(['user', 'dashboard']), patchAccount);
router.delete('/', checkScopes(['user', 'dashboard']), deleteAccount);
router.put('/password', checkScopes(['user', 'dashboard']), validate(validations.putPassword), putPassword);
router.post('/', validate(validations.postAccount), postAccount);
export default router;
