import express from 'express';
import { getHealth } from './get.controller';
import { getAssetPoolVersions } from './assetPools.controller';

const router = express.Router();

router.get('/', getHealth);
router.get('/assetpools', getAssetPoolVersions);

export default router;
