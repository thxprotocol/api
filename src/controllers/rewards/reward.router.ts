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
import { rateLimitRewardClaim, rateLimitRewardGive } from '@/util/ratelimiter';

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
    checkScopes(['admin', 'user', 'widget', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(ReadReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadReward.controller,
);
router.post(
    '/',
    checkScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(CreateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateReward.controller,
);
router.patch(
    '/:id',
    checkScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(UpdateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    UpdateReward.controller,
);
router.post(
    '/:id/claim',
    checkScopes(['widget', 'user']),
    // rateLimitRewardClaim,
    assertRequestInput(CreateRewardClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardClaim.controller,
);
router.post(
    '/:id/give',
    checkScopes(['admin']),
    rateLimitRewardGive,
    assertRequestInput(CreateRewardGive.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardGive.controller,
);

export default router;
