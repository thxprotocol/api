import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { getAssetPools } from './getAll.action';
import { getAssetPool, readAssetPoolValidation } from './get.action';
import { createAssetPoolValidation, postAssetPool } from './post.controller';
import { deleteAssetPool, deleteAssetPoolValidation } from './delete.action';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(createAssetPoolValidation), postAssetPool);
router.get('/', assertScopes(['dashboard']), getAssetPools);
router.get(
    '/:address',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(readAssetPoolValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    getAssetPool,
);
router.delete(
    '/:address',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(deleteAssetPoolValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    deleteAssetPool,
);
export default router;
