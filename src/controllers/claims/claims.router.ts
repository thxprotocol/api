import express from 'express';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, guard, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

import ReadClaim from './get.controller';

const router = express.Router();

router.get('/:id', guard.check(['claims:read']), assertRequestInput(ReadClaim.validation), ReadClaim.controller);

export default router;
