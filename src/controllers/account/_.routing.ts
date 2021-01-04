import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { putPassword } from './putPassword.action';
import checkScope from 'express-jwt-authz';

const router = express.Router();

/*
 * OAuth2 Scopes:
 * - admin.account:read
 * - admin.account:write
 * - user.me:read
 * - user.me:write
 */
router.get('/', checkScope(['admin.account:read', 'user.me:read']), getAccount);
router.patch(
    '/',
    checkScope(['admin.account:read', 'user.me:read', 'admin.account:write', 'user.me:write']),
    patchAccount,
);
router.delete('/', checkScope(['admin.asset_pool:read', 'user.me:write']), deleteAccount);
router.post(
    '/password',
    checkScope(['user.asset_pool:read', 'admin.asset_pool:read', 'user.asset_pool:write', 'admin.asset_pool:write']),
    validate(validations.putPassword),
    putPassword,
);

export default router;
