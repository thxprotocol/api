import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreatePool from './post.controller';
import ReadPool from './get.controller';
import DeletePool from './delete.controller';
import ListPools from './list.controller';
import ListPoolMembers from './members/list.controller';
import ListDeposits from './deposits/list.controller';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(CreatePool.validation), CreatePool.controller);
router.get('/', assertScopes(['dashboard']), ListPools.controller);
router.get(
    '/:address/members',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListPoolMembers.controller,
);
router.get(
    '/:address/deposits',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListDeposits.controller,
);
router.get(
    '/:address',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(ReadPool.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadPool.controller,
);
router.delete(
    '/:address',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(DeletePool.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeletePool.controller,
);
export default router;
