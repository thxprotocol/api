import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';

const router = express.Router();

router.post('/', validate(validations.postAssetPool), postAssetPool);
router.get('/:address', validate(validations.getAssetPool), getAssetPool);
router.patch('/:address', validate(validations.patchAssetPool), patchAssetPool);

export default router;
