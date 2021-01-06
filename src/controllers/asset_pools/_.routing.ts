import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.post('/', checkScopes(['admin']), validate(validations.postAssetPool), postAssetPool);
router.get('/:address', checkScopes(['admin', 'user']), validate(validations.getAssetPool), getAssetPool);
router.patch('/:address', checkScopes(['admin']), validate(validations.patchAssetPool), patchAssetPool);

export default router;
