import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { assertAssetPoolAccess } from '@/middlewares';
import { validations } from './_.validation';
import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { assertPlan, requireAssetPoolHeader } from '@/middlewares';
import { postVote } from './postVote.action';
import { postPollFinalize } from './postPollFinalize.action';
import { deleteVote } from './deleteVote.action';
import { postWithdrawal } from './post.action';
import { DeleteWithdrawalController } from './delete.controller';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.post(
    '/',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    validate(validations.postWithdrawal),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postWithdrawal,
);
router.get(
    '/',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    validate(validations.getWithdrawals),
    requireAssetPoolHeader,
    getWithdrawals,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    validate(validations.getWithdrawal),
    requireAssetPoolHeader,
    getWithdrawal,
);
router.post(
    '/:id/vote',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    validate(validations.postVote),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postVote,
);
router.delete(
    '/:id/vote',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    validate(validations.deleteVote),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    deleteVote,
);
router.post(
    '/:id/withdraw',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    validate(validations.postPollFinalize),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postPollFinalize,
);

router.delete(
    '/:id',
    checkScopes(['user']),
    assertAssetPoolAccess,
    validate(validations.deleteWithdrawal),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeleteWithdrawalController,
);
export default router;
