import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertPlan, assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateMember from './post.controller';
import ReadMember from './get.controller';
import UpdateMember from './patch.controller';
import DeleteMember from './delete.controller';
import ListMembers from './list.controller';
import { adminScopes, userAdminScopes } from '../scopes';

const router = express.Router();

router.get(
    '/',
    checkScopes(adminScopes),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListMembers.controller,
);
router.post(
    '/',
    checkScopes(adminScopes),
    assertAssetPoolAccess,
    assertRequestInput(CreateMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateMember.controller,
);
router.patch(
    '/:address',
    checkScopes(adminScopes),
    assertAssetPoolAccess,
    assertRequestInput(UpdateMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    UpdateMember.controller,
);
router.delete(
    '/:address',
    checkScopes(adminScopes),
    assertAssetPoolAccess,
    assertRequestInput(DeleteMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeleteMember.controller,
);
router.get(
    '/:address',
    checkScopes(userAdminScopes),
    assertAssetPoolAccess,
    assertRequestInput(ReadMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadMember.controller,
);

export default router;
