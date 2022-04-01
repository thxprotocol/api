import express from 'express';
import checkScopes from 'express-jwt-authz';

import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { getRewards } from './get.action';
import { getReward } from './getReward.action';
import { postReward } from './post.action';
import { patchReward } from './patch.action';
import { postRewardClaim } from './postRewardClaim.action';
import { postRewardClaimFor } from './postRewardClaimFor.action';
import { requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { rateLimitRewardGive } from '@/util/ratelimiter';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin', 'user', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.getRewards),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    getRewards,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user', 'widget', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.getReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    getReward,
);
router.post(
    '/',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.postReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postReward,
);
router.patch(
    '/:id',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.patchReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    patchReward,
);
router.post(
    '/:id/claim',
    checkScopes(['widget', 'user']),
    // rateLimitRewardClaim,
    validate(validations.postRewardClaim),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postRewardClaim,
);
router.post(
    '/:id/give',
    checkScopes(['admin']),
    rateLimitRewardGive,
    validate(validations.postRewardClaimFor),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postRewardClaimFor,
);

export default router;
