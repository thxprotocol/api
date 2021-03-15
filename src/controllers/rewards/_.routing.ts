import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getRewards } from './get.action';
import { getReward } from './getReward.action';
import { postReward } from './post.action';
import { patchReward } from './patch.action';
import { postRewardClaim } from './postRewardClaim.action';
import { postRewardClaimFor } from './postRewardClaimFor.action';
import { parseHeader } from '../../util/network';
import { postVote } from './postVote.action';
import { deleteVote } from './deleteVote.action';
import { postPollFinalize } from './postPollFinalize.action';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.get('/', checkScopes(['admin', 'user']), validate(validations.getRewards), parseHeader, getRewards);
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

router.post('/:id/poll/vote', checkScopes(['admin']), validate(validations.postVote), parseHeader, postVote);
router.delete('/:id/poll/vote', checkScopes(['admin']), validate(validations.deleteVote), parseHeader, deleteVote);
router.post(
    '/:id/poll/finalize',
    checkScopes(['admin']),
    validate(validations.postPollFinalize),
    parseHeader,
    postPollFinalize,
);

export default router;
