import express from 'express';
import { validate } from '../../util/validation';
import {
    postAssetPoolClaimReward,
    postCallAssetPool,
    postCallAssetPoolProposeWithdraw,
} from './postCallAssetPool.action';
import { postCallBasePoll, postCallBasePollFinalize } from './postCallBasePoll.action';
import { postCallWithdrawalWithdraw } from './postCallWithdrawPoll.action';
import { validations } from './_.validation';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.post('/base_poll', checkScopes(['user']), validate(validations.postCallBasePoll), postCallBasePoll);
router.post(
    '/base_poll/finalize',
    checkScopes(['user']),
    validate(validations.postCallBasePoll),
    postCallBasePollFinalize,
);
// router.post('/base_poll/revoke_vote', validate(validations.postCallBasePoll), postCallBasePollRevokeVote);
router.post('/asset_pool', checkScopes(['user']), validate(validations.postCallAssetPool), postCallAssetPool);
router.post(
    '/asset_pool/propose_withdraw',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    postCallAssetPoolProposeWithdraw,
);
router.post(
    '/asset_pool/claim_reward',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    postAssetPoolClaimReward,
);
// router.post('/asset_pool/update_reward', validate(validations.postCallBasePoll), postAssetPoolUpdateReward);
router.post(
    '/withdrawals/withdraw',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    postCallWithdrawalWithdraw,
);

export default router;
