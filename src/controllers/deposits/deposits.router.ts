import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateDeposit from './post.controller';
import ReadDeposit from './get.controller';
import ListDeposits from './list.controller';
import CreateDepositAdmin from './admin/post.controller';
import CreateDepositApprove from './approve/post.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import { dashboardScopes, userScopes } from '../scopes';

const router = express.Router();

router.get(
    '/',
    assertScopes(dashboardScopes),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListDeposits.controller,
);
router.get(
    '/:id',
    assertScopes(dashboardScopes),
    assertAssetPoolAccess,
    assertRequestInput(ReadDeposit.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadDeposit.controller,
);
router.post(
    '/',
    assertScopes(userScopes),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertRequestInput(CreateDeposit.validation),
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDeposit.controller,
);
router.post(
    '/admin',
    assertScopes(dashboardScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateDepositApprove.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDepositAdmin.controller,
);
router.post(
    '/approve',
    assertScopes(userScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateDepositApprove.validation),
    requireAssetPoolHeader,
    CreateDepositApprove.controller,
);

export default router;
