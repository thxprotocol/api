import express from 'express';
import { validateAssetPoolHeader } from '../../util/validation';
import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { getAccountNonce } from './getNonce.action';
import { parseHeader } from '../../util/network';

const router = express.Router();

router.get('/', checkScopes(['user', 'widget', 'dashboard']), getAccount);
router.get('/nonce', checkScopes(['user', 'dashboard']), validateAssetPoolHeader, parseHeader, getAccountNonce);
router.patch('/', checkScopes(['user', 'dashboard']), patchAccount);
router.delete('/', checkScopes(['user', 'dashboard']), deleteAccount);

export default router;
