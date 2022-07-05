import express from 'express';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, guard, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

import ReadClaim from './get.controller';
import ListClaim from './list.controller';

const router = express.Router();

router.get(
    '/:id',
    guard.check(['claims:read']),
    assertAssetPoolAccess,
    assertRequestInput(ReadClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadClaim.controller,
);

router.get(
    '/reward/:id',
    guard.check(['claims:read']),
    assertAssetPoolAccess,
    assertRequestInput(ListClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListClaim.controller,
);

export default router;
