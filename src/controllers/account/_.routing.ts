import express from 'express';
import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { postAccount } from './post.action';
import checkScopes from 'express-jwt-authz';
import { parseHeader } from '../../util/network';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { postLogin } from './postLogin.action';

const router = express.Router();

router.get('/', checkScopes(['user', 'widget', 'dashboard']), getAccount);
router.patch('/', checkScopes(['user', 'dashboard']), patchAccount);
router.delete('/', checkScopes(['user', 'dashboard']), deleteAccount);
router.post('/', validate(validations.postAccount), checkScopes(['admin']), parseHeader, postAccount);
router.post('/login', validate(validations.postLogin), checkScopes(['admin']), postLogin);

export default router;
