import express from 'express';
import { assertRequestInput, guard } from '@/middlewares';

import GetBrand from './get.controller';
import PutBrand from './put.controller';

const router = express.Router();
router.get('/:pool_address', guard.check(['brands:read']), GetBrand.controller);
router.put(
    '/:pool_address',
    guard.check(['brands:write']),
    assertRequestInput(PutBrand.validation),
    PutBrand.controller,
);

export default router;
