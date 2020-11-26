import express from 'express';
import * as rewardController from '../../controllers/reward';
import { validations, validate } from '../../util/validation';

const router = express.Router();

router.get('/:id/claim', validate(validations.getRewardClaim), rewardController.getRewardClaim);
router.post('/:id/claim', validate(validations.postRewardClaim), rewardController.postRewardClaim);
router.get('/:id', validate(validations.getReward), rewardController.getReward);
router.post('/', validate(validations.postReward), rewardController.postReward);
router.patch('/:id', validate(validations.patchReward), rewardController.patchReward);

export default router;
