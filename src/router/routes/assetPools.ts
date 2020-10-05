import express from 'express';
import * as assetPoolController from '../../controllers/assetPool';
import { validate } from '../../util/validation';

const router = express.Router();

// Asset Pools
router.post('/', validate.postAssetPools, assetPoolController.postAssetPool);
router.get('/:address', validate.getAssetPool, assetPoolController.getAssetPool);
router.put('/:address', validate.putAssetPool, assetPoolController.putAssetPool);
router.post('/:address/deposit', validate.postAssetPoolDeposit, assetPoolController.postAssetPoolDeposit);

export default router;
