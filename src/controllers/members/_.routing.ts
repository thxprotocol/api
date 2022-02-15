import express from 'express';
import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { getMembers } from './get.action';
import { getMember } from './getMember.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { parseHeader } from '@/util/network';

const router = express.Router();

router.get('/', checkScopes(['admin']), validateAssetPoolHeader, parseHeader, getMembers);
router.post(
    '/',
    checkScopes(['admin', 'members:write']),
    validateAssetPoolHeader,
    validate(validations.postMember),
    parseHeader,
    postMember,
);
router.patch(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.patchMember),
    parseHeader,
    patchMember,
);
router.delete(
    '/:address',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteMember),
    parseHeader,
    deleteMember,
);
router.get(
    '/:address',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getMember),
    parseHeader,
    getMember,
);

export default router;
