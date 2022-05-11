import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertAssetPoolAccess, assertRequestInput, requireAssetPoolHeader, assertPlan } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreatePool from './post.controller';
import ReadPool from './get.controller';
import DeletePool from './delete.controller';
import ListPools from './list.controller';
import GetPoolMembers from './get.members.action';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(CreatePool.validation), CreatePool.controller);
router.get('/', assertScopes(['dashboard']), ListPools.controller);
router.get(
    '/:address/members',
    assertScopes(['dashboard']),
    assertAssetPoolAccess,
    assertRequestInput(readAssetPoolValidation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    GetPoolMembers.controller,
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
