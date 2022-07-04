import express from 'express';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, guard, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

import ReadClaim from './get.controller';

const router = express.Router();

router.get(
    '/:rewardId',
    guard.check(['claims:read']),
    assertAssetPoolAccess,
    assertRequestInput(ReadClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadClaim.controller,
);

export default router;
