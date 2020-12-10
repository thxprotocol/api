import express from 'express';
import { validate } from '../../util/validation';
import {
    postAssetPoolClaimReward,
    postCallAssetPool,
    postCallAssetPoolProposeWithdraw,
} from './postCallAssetPool.action';
import { postCallBasePoll } from './postCallBasePoll.action';
import { postCallWithdrawalWithdraw } from './postCallWithdrawPoll.action';
import { validations } from './_.validation';

const router = express.Router();

router.post('/base_poll', validate(validations.postCallBasePoll), postCallBasePoll);
// router.post('/base_poll/finalize', validate(validations.postCallBasePoll), postCallBasePollFinalize);
// router.post('/base_poll/revoke_vote', validate(validations.postCallBasePoll), postCallBasePollRevokeVote);
router.post('/asset_pool', validate(validations.postCallAssetPool), postCallAssetPool);
router.post('/asset_pool/propose_withdraw', validate(validations.postCallAssetPool), postCallAssetPoolProposeWithdraw);
router.post('/asset_pool/claim_reward', validate(validations.postCallAssetPool), postAssetPoolClaimReward);
// router.post('/asset_pool/update_reward', validate(validations.postCallBasePoll), postAssetPoolUpdateReward);
router.post('/withdrawals/withdraw', validate(validations.postCallAssetPool), postCallWithdrawalWithdraw);

export default router;
