import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateDeposit from './post.controller';
import ReadDeposit from './get.controller';
import ListDeposits from './list.controller';
import CreateDepositApprove from './approve/post.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    assertScopes(['dashboard', 'deposits:read']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListDeposits.controller,
);
router.get(
    '/:id',
    assertScopes(['dashboard', 'deposits:read']),
    assertAssetPoolAccess,
    assertRequestInput(ReadDeposit.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadDeposit.controller,
);
router.post(
    '/',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertRequestInput(CreateDeposit.validation),
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDeposit.controller,
);
router.post(
    '/approve',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateDepositApprove.validation),
    requireAssetPoolHeader,
    CreateDepositApprove.controller,
);

export default router;
