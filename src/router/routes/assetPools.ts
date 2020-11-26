import express from 'express';
import * as assetPoolController from '../../controllers/assetPool';
import { validations, validate } from '../../util/validation';

const router = express.Router();

// Asset Pools
router.post('/', validate(validations.postAssetPools), assetPoolController.postAssetPool);
router.get('/:address', validate(validations.getAssetPool), assetPoolController.getAssetPool);
router.patch('/:address', validate(validations.patchAssetPool), assetPoolController.patchAssetPool);

export default router;
