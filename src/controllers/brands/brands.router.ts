import express from 'express';
import { assertRequestInput, guard, requireAssetPoolHeader } from '@/middlewares';

import GetBrand from './get.controller';
import PutBrand from './put.controller';

const router = express.Router();
router.get('/', guard.check(['brands:read']), requireAssetPoolHeader, GetBrand.controller);
router.put(
    '/',
    guard.check(['brands:write']),
    assertRequestInput(PutBrand.validation),
    requireAssetPoolHeader,
    PutBrand.controller,
);

export default router;
