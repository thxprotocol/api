import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getRewardClaim } from './getRewardClaim.action';
import { postRewardClaim } from './postRewardClaim.action';
import { getReward } from './get.action';
import { postReward } from './post.action';
import { patchReward } from './patch.action';

const router = express.Router();

router.get('/:id/claim', validate(validations.getRewardClaim), getRewardClaim);
router.post('/:id/claim', validate(validations.postRewardClaim), postRewardClaim);
router.get('/:id', validate(validations.getReward), getReward);
router.post('/', validate(validations.postReward), postReward);
router.patch('/:id', validate(validations.patchReward), patchReward);

export default router;
