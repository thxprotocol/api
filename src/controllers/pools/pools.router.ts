import express from 'express';
import assertScopes from 'express-jwt-authz';
import {
    assertRequestInput,
    assertPlan,
    assertPoolOwner,
    assertAssetPoolAccess,
    requireAssetPoolHeader,
} from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreatePool from './post.controller';
import ReadPool from './get.controller';
import DeletePool from './delete.controller';
import ListPools from './list.controller';
import ListPoolMembers from './members/list.controller';
import CreatePoolTopup from './topup/post.controller';

const router = express.Router();

router.post(
    '/',
    assertScopes(['pools:read', 'pools:write']),
    assertRequestInput(CreatePool.validation),
    CreatePool.controller,
);
router.get('/', assertScopes(['pools:read']), ListPools.controller);
router.get(
    '/:id/members',
    assertScopes(['pools:read', 'members:read']),
    assertRequestInput(ReadPool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListPoolMembers.controller,
);
router.get(
    '/:id',
    assertScopes(['pools:read']),
    assertRequestInput(ReadPool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadPool.controller,
);
router.delete(
    '/:id',
    assertScopes(['pools:write']),
    assertRequestInput(DeletePool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeletePool.controller,
);
router.post(
    '/:id/topup',
    assertScopes(['dashboard', 'deposits:read', 'deposits:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreatePoolTopup.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreatePoolTopup.controller,
);
export default router;
