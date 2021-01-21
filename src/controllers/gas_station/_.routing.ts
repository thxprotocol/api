import express from 'express';
import { parseHeader } from '../../util/network';
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

router.post('/base_poll', checkScopes(['user']), validate(validations.postCallBasePoll), parseHeader, postCallBasePoll);
router.post(
    '/base_poll/finalize',
    checkScopes(['user']),
    validate(validations.postCallBasePoll),
    parseHeader,
    postCallBasePollFinalize,
);
// router.post('/base_poll/revoke_vote', validate(validations.postCallBasePoll), postCallBasePollRevokeVote);
router.post(
    '/asset_pool',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    parseHeader,
    postCallAssetPool,
);
router.post(
    '/asset_pool/propose_withdraw',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    parseHeader,
    postCallAssetPoolProposeWithdraw,
);
router.post(
    '/asset_pool/claim_reward',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    parseHeader,
    postAssetPoolClaimReward,
);
// router.post('/asset_pool/update_reward', validate(validations.postCallBasePoll), postAssetPoolUpdateReward);
router.post(
    '/withdrawals/withdraw',
    checkScopes(['user']),
    validate(validations.postCallAssetPool),
    parseHeader,
    postCallWithdrawalWithdraw,
);

export default router;
