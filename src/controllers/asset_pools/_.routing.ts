import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';
import jwtAuthz from 'express-jwt-authz';

const router = express.Router();

/*
 * OAuth2 Scopes:
 * - admin.asset_pool:read
 * - admin.asset_pool:write
 * - user.asset_pool:read
 */
router.post('/', jwtAuthz(['admin.asset_pool:write']), validate(validations.postAssetPool), postAssetPool);
router.get(
    '/:address',
    jwtAuthz(['user.asset_pool:read', 'admin.asset_pool:read']),
    validate(validations.getAssetPool),
    getAssetPool,
);
router.patch(
    '/:address',
    jwtAuthz(['admin.asset_pool:read', 'admin.asset_pool:write']),
    validate(validations.patchAssetPool),
    patchAssetPool,
);

export default router;
