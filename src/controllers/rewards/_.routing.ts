import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getReward } from './get.action';
import { postReward } from './post.action';
import { patchReward } from './patch.action';
import { postRewardClaim } from './postRewardClaim.action';
import { postRewardClaimFor } from './postRewardClaimFor.action';
import { parseHeader } from '../../util/network';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.get('/:id', checkScopes(['admin', 'user']), validate(validations.getReward), parseHeader, getReward);
router.post('/', checkScopes(['admin']), validate(validations.postReward), parseHeader, postReward);
router.patch('/:id', checkScopes(['admin']), validate(validations.patchReward), parseHeader, patchReward);
router.post('/:id/claim', checkScopes(['admin']), validate(validations.postRewardClaim), parseHeader, postRewardClaim);
router.post(
    '/:id/give',
    checkScopes(['admin']),
    validate(validations.postRewardClaimFor),
    parseHeader,
    postRewardClaimFor,
);

export default router;
