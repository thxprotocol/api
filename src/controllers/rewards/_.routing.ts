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
import { requireAssetPoolHeader } from '@/middlewares';
import { postVote } from './postVote.action';
import { deleteVote } from './deleteVote.action';
import { postPollFinalize } from './postPollFinalize.action';
import { rateLimitRewardGive } from '@/util/ratelimiter';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin', 'user', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.getRewards),
    requireAssetPoolHeader,
    getRewards,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user', 'widget', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.getReward),
    requireAssetPoolHeader,
    getReward,
);
router.post(
    '/',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.postReward),
    requireAssetPoolHeader,
    postReward,
);
router.patch(
    '/:id',
    checkScopes(['admin', 'dashboard']),
    validateAssetPoolHeader,
    validate(validations.patchReward),
    requireAssetPoolHeader,
    patchReward,
);
router.post(
    '/:id/claim',
    checkScopes(['widget', 'user']),
    // rateLimitRewardClaim,
    validate(validations.postRewardClaim),
    requireAssetPoolHeader,
    postRewardClaim,
);
router.post(
    '/:id/give',
    checkScopes(['admin']),
    rateLimitRewardGive,
    validate(validations.postRewardClaimFor),
    requireAssetPoolHeader,
    postRewardClaimFor,
);

router.post(
    '/:id/poll/vote',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.postVote),
    requireAssetPoolHeader,
    postVote,
);
router.delete(
    '/:id/poll/vote',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteVote),
    requireAssetPoolHeader,
    deleteVote,
);
router.post(
    '/:id/poll/finalize',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.postPollFinalize),
    requireAssetPoolHeader,
    postPollFinalize,
);

export default router;
