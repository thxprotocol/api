import express from 'express';
import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { getMembers } from './get.action';
import { getMember } from './getMember.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { requireAssetPoolHeader } from '@/middlewares';

const router = express.Router();

router.get('/', checkScopes(['admin']), validateAssetPoolHeader, requireAssetPoolHeader, getMembers);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    validateAssetPoolHeader,
    validate(validations.postMember),
    requireAssetPoolHeader,
    postMember,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.patchMember),
    requireAssetPoolHeader,
    patchMember,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteMember),
    requireAssetPoolHeader,
    deleteMember,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getMember),
    requireAssetPoolHeader,
    getMember,
);

export default router;
