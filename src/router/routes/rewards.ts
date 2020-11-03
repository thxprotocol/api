import express from 'express';
import * as rewardController from '../../controllers/reward';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/:id/claim', validate.getRewardClaim, rewardController.getRewardClaim);
router.post('/:id/claim', validate.postRewardClaim, rewardController.postRewardClaim);
router.get('/:id', validate.getReward, rewardController.getReward);
router.post('/', validate.postReward, rewardController.postReward);
router.patch('/:id', validate.patchReward, rewardController.patchReward);

export default router;
