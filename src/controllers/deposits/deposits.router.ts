import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateDeposit from './post.controller';
import ReadDeposit from './get.controller';
import ListDeposits from './list.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';


import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListDeposits.controller,
);
router.get(
    '/:id',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(ReadDeposit.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadDeposit.controller,
);

router.post(
        '/',
        assertScopes(['user', 'deposits:read', 'deposits:write']),
        assertAssetPoolAccess,
        assertRequestInput(CreateDeposit.createDepositValidation),
        requireAssetPoolHeader,
        assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
        CreateDeposit.createDepositController,
);
router.post('/:address', 
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(CreateDeposit.createAssetPoolDepositValidation), 
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDeposit.createAssetPoolDepositController
);
export default router;
