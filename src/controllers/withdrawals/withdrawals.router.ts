import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { assertAssetPoolAccess } from '@/middlewares';
import { validations } from './_.validation';
import { getWithdrawal } from './get.controller';
import { getWithdrawals } from './list.controller';
import { assertPlan, requireAssetPoolHeader } from '@/middlewares';
import { postPollFinalize } from './finalize/post.controller';
import { postWithdrawal } from './post.controller';
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
