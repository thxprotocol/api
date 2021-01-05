import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';
import checkJwt from 'express-jwt-authz';

const router = express.Router();

/*
 * OAuth2 Scopes:
 * - admin
 * - admin.asset_pool:read
 * - admin.asset_pool:write
 * - user.asset_pool:read
 */
router.post('/', checkJwt(['admin']), validate(validations.postAssetPool), postAssetPool);
router.get('/:address', checkJwt(['admin']), validate(validations.getAssetPool), getAssetPool);
router.patch('/:address', checkJwt(['admin']), validate(validations.patchAssetPool), patchAssetPool);

export default router;
