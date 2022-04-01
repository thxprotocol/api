import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import CreateDepositController, { createDepositValidation } from './post.controller';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.post(
    '/',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(createDepositValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    CreateDepositController,
);

export default router;
