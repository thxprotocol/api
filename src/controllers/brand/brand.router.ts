import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';

import GetBrand from './get.controller';
import PutBrand from './put.controller';

const router = express.Router();
router.get('/:pool_address', assertScopes(['brands:read']), GetBrand.controller);
router.put(
    '/:pool_address',
    assertScopes(['brands:write']),
    assertRequestInput(PutBrand.validation),
    PutBrand.controller,
);

export default router;
