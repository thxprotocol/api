import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertPlan, assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateWithdrawalFinalize from './finalize/post.controller';
import CreateWithdrawal from './post.controller';
import ReadWithdrawal from './get.controller';
import DeleteWithdrawal from './delete.controller';
import ListWithdrawal from './list.controller';

const router = express.Router();

router.post(
    '/',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(CreateWithdrawal.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateWithdrawal.controller,
);
router.get(
    '/',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    assertRequestInput(ListWithdrawal.validation),
    requireAssetPoolHeader,
    ListWithdrawal.controller,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    assertRequestInput(ReadWithdrawal.validation),
    requireAssetPoolHeader,
    ReadWithdrawal.controller,
);
router.post(
    '/:id/withdraw',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    assertRequestInput(CreateWithdrawalFinalize.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateWithdrawalFinalize.controller,
);
router.delete(
    '/:id',
    checkScopes(['user']),
    assertAssetPoolAccess,
    assertRequestInput(DeleteWithdrawal.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeleteWithdrawal.controller,
);

export default router;
