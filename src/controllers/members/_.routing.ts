import express from 'express';
import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { getMember } from './get.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { parseHeader } from '@/util/network';

const router = express.Router();

router.post(
    '/',
    checkScopes(['admin']),
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
