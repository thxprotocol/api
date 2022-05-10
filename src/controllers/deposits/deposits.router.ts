import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateDeposit from './post.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';


import { AccountPlanType } from '@/types/enums';

const router = express.Router();
router.post(
    '/',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateDeposit.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDeposit.controller,
);
router.post('/:address/deposit', assertScopes(['dashboard']), assertRequestInput(CreateDeposit.validation), CreateDeposit.controller);
export default router;
