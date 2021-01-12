import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getAssetPool } from './get.action';
import { postAssetPool } from './post.action';
import { patchAssetPool } from './patch.action';

import { parseHeader } from '../../util/network';

const router = express.Router();

router.post('/', validate(validations.postAssetPool), parseHeader, postAssetPool);
router.get('/:address', validate(validations.getAssetPool), parseHeader, getAssetPool);
router.patch('/:address', validate(validations.patchAssetPool), parseHeader, patchAssetPool);

export default router;
