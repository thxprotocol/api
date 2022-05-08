import express from 'express';
import checkScopes from 'express-jwt-authz';

import { validate } from '@/util/validation';
import { assertAssetPoolAccess } from '@/middlewares';
import { validations } from './_.validation';
import { getRewards } from './list.controller';
import { getReward } from './get.controller';
import { postReward } from './post.controller';
import { patchReward } from './patch.controller';
import { postRewardClaim } from './claim/post.controller';
import { postRewardClaimFor } from './give/post.controller';
import { requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { rateLimitRewardGive } from '@/util/ratelimiter';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin', 'user', 'dashboard']),
    assertAssetPoolAccess,
    validate(validations.getRewards),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getRewards,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user', 'widget', 'dashboard']),
    assertAssetPoolAccess,
    validate(validations.getReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getReward,
);
router.post(
    '/',
    checkScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    validate(validations.postReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postReward,
);
router.patch(
    '/:id',
    checkScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    validate(validations.patchReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    patchReward,
);
router.post(
    '/:id/claim',
    checkScopes(['widget', 'user']),
    // rateLimitRewardClaim,
    validate(validations.postRewardClaim),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postRewardClaim,
);
router.post(
    '/:id/give',
    checkScopes(['admin']),
    rateLimitRewardGive,
    validate(validations.postRewardClaimFor),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postRewardClaimFor,
);

export default router;
