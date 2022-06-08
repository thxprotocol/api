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

const router = express.Router();

router.get(
    '/',
    checkScopes(['rewards:read']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListRewards.controller,
);
router.get(
    '/:id',
    checkScopes(['rewards:read']),
    assertAssetPoolAccess,
    assertRequestInput(ReadReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadReward.controller,
);
router.post(
    '/',
    checkScopes(['rewards:write', 'rewards:read']),
    assertAssetPoolAccess,
    assertRequestInput(CreateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateReward.controller,
);
router.patch(
    '/:id',
    checkScopes(['rewards:write', 'rewards:read']),
    assertAssetPoolAccess,
    assertRequestInput(UpdateReward.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    UpdateReward.controller,
);
router.post(
    '/:id/claim',
    checkScopes(['withdrawals:write', 'rewards:read']),
    // rateLimitRewardClaim,
    assertRequestInput(CreateRewardClaim.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardClaim.controller,
);
router.post(
    '/:id/give',
    checkScopes(['withdrawals:write', 'rewards:read']),
    rateLimitRewardGive,
    assertRequestInput(CreateRewardGive.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateRewardGive.controller,
);

export default router;
