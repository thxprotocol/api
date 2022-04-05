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
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getMembers,
);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    validateAssetPoolHeader,
    validate(validations.postMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    postMember,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.patchMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    patchMember,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    deleteMember,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getMember),
    requireAssetPoolHeader,
    assertPlan([AccountPlanType.Basic, AccountPlanType.Premium]),
    getMember,
);

export default router;
