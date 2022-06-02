import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateReward from './post.controller';
import ReadReward from './get.controller';
import UpdateReward from './patch.controller';
import ListRewards from './list.controller';
import CreateRewardClaim from './claim/post.controller';
import CreateRewardGive from './give/post.controller';
import { rateLimitRewardGive } from '@/util/ratelimiter';
import { adminDashboardScopes, adminScopes, userAdminDashboardScopes, userScopes } from '../scopes';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin', 'user', 'dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListRewards.controller,
);
router.get(
    '/:id',
    checkScopes(userAdminDashboardScopes),
    assertAssetPoolAccess,
    assertRequestInput(ReadReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadReward.controller,
);
router.post(
    '/',
    checkScopes(adminDashboardScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateReward.controller,
);
router.patch(
    '/:id',
    checkScopes(adminDashboardScopes),
    assertAssetPoolAccess,
    assertRequestInput(UpdateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    UpdateReward.controller,
);
router.post(
    '/:id/claim',
    checkScopes(userScopes),
    // rateLimitRewardClaim,
    assertRequestInput(CreateRewardClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardClaim.controller,
);
router.post(
    '/:id/give',
    checkScopes(adminScopes),
    rateLimitRewardGive,
    assertRequestInput(CreateRewardGive.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardGive.controller,
);

export default router;
