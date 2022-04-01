import express from 'express';
import { validate, validateAssetPoolHeader } from '@/util/validation';
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
    validateAssetPoolHeader,
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    getMembers,
);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    validateAssetPoolHeader,
    validate(validations.postMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    postMember,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.patchMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    patchMember,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    deleteMember,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Community, AccountPlanType.Creator]),
    getMember,
);

export default router;
