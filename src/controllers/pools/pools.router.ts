import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, assertPlan, assertPoolOwner } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreatePool from './post.controller';
import ReadPool from './get.controller';
import DeletePool from './delete.controller';
import ListPools from './list.controller';
import ListPoolMembers from './members/list.controller';
import { dashboardScopes } from '../scopes';

const router = express.Router();

router.post('/', assertScopes(dashboardScopes), assertRequestInput(CreatePool.validation), CreatePool.controller);
router.get('/', assertScopes(dashboardScopes), ListPools.controller);
router.get(
    '/:id/members',
    assertScopes(dashboardScopes),
    assertRequestInput(ReadPool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListPoolMembers.controller,
);
router.get(
    '/:id',
    assertScopes(dashboardScopes),
    assertRequestInput(ReadPool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadPool.controller,
);
router.delete(
    '/:id',
    assertScopes(dashboardScopes),
    assertRequestInput(DeletePool.validation),
    assertPoolOwner,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeletePool.controller,
);
export default router;
