import express from 'express';
import * as rewardController from '../../controllers/reward';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/:id/claim', validate.getRewardClaim, rewardController.getRewardClaim);
router.get('/:id', validate.getReward, rewardController.getReward);
router.post('/', validate.postReward, rewardController.postReward);
router.get('/:id/update', validate.getRewardUpdate, rewardController.getRewardUpdate);

// TODO router.get('/rewards/:address/finalize', validate.getFinalize, rewardController.getFinalize);
// TODO router.post('/rewards/:address/finalize', validate.postFinalize, rewardController.postFinalize);

export default router;
