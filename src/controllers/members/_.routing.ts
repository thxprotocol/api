import express from 'express';
import { validate } from '@/util/validation';
import { assertAssetPoolAccess } from '@/middlewares';
import { validations } from './_.validation';
import { getMembers } from './get.action';
import { getMember } from './getMember.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { assertPlan, requireAssetPoolHeader } from '@/middlewares';
import { AccountPlanType } from '@/types/enums';

const router = express.Router();

router.get(
    '/',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getMembers,
);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    assertAssetPoolAccess,
    validate(validations.postMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postMember,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    validate(validations.patchMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    patchMember,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    assertAssetPoolAccess,
    validate(validations.deleteMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    deleteMember,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    assertAssetPoolAccess,
    validate(validations.getMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getMember,
);

export default router;
