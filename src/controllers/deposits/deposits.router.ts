import express from 'express';
import assertScopes from 'express-jwt-authz';
import CreateDeposit from './post.controller';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';


import { AccountPlanType } from '@/types/enums';

const router = express.Router();

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
    assertScopes(['admin', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateDeposit.createAssetPoolDepositValidation), 
    requireAssetPoolHeader,
    CreateDeposit.createAssetPoolDepositController
);
export default router;
