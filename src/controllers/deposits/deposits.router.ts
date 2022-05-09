import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { CreateDepositController, createAssetPoolDepositValidation, createDepositValidation, CreateAssetPoolDepositController } from './post.controller';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();
router.post(
    '/',
    assertScopes(['user', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(createDepositValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateDepositController,
);
router.post('/:address/deposit', assertScopes(['dashboard']), assertRequestInput(createAssetPoolDepositValidation), CreateAssetPoolDepositController);
export default router;
