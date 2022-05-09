import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertPlan, assertRequestInput, assertAssetPoolAccess, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';
import CreateMember from './post.controller';
import ReadMember from './get.controller';
import UpdateMember from './patch.controller';
import DeleteMember from './delete.controller';
import ListMembers from './list.controller';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ListMembers.controller,
);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    assertAssetPoolAccess,
    assertRequestInput(CreateMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    CreateMember.controller,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(UpdateMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    UpdateMember.controller,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    assertRequestInput(DeleteMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    DeleteMember.controller,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    assertRequestInput(ReadMember.validation),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    ReadMember.controller,
);

export default router;
