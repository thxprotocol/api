import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreatePool from './post.controller';
import ReadPool from './get.controller';
import DeletePool from './delete.controller';
import ListPools from './list.controller';
import ListPoolMembers from './members/list.controller';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(CreatePool.validation), CreatePool.controller);
router.get('/', assertScopes(['dashboard']), ListPools.controller);
router.get(
    '/:id/members',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListPoolMembers.controller,
);
router.get(
    '/:id',
    assertScopes(['admin', 'dashboard']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertRequestInput(ReadPool.validation),
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadPool.controller,
);
router.delete(
    '/:id',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(DeletePool.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeletePool.controller,
);
export default router;
