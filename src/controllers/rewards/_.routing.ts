import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getReward } from './get.action';
import { postReward } from './post.action';
import { patchReward } from './patch.action';
import { postRewardClaim } from './postRewardClaim.action';
import { postRewardClaimFor } from './postRewardClaimFor.action';

const router = express.Router();

router.get('/:id', validate(validations.getReward), getReward);
router.post('/', validate(validations.postReward), postReward);
router.patch('/:id', validate(validations.patchReward), patchReward);
router.post('/:id/claim', validate(validations.postRewardClaim), postRewardClaim);
router.post('/:id/give', validate(validations.postRewardClaimFor), postRewardClaimFor);

export default router;
