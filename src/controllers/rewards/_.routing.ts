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
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getRewards,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user', 'widget', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.getReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getReward,
);
router.post(
    '/',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.postReward),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postReward,
);
router.patch(
    '/:id',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
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
