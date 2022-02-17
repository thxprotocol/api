import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate, validateAssetPoolHeader } from '@/util/validation';
import { validations } from './_.validation';
import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { parseHeader } from '@/util/network';
import { postVote } from './postVote.action';
import { postPollFinalize } from './postPollFinalize.action';
import { deleteVote } from './deleteVote.action';
import { postWithdrawal } from './post.action';

const router = express.Router();

router.post(
    '/',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.postWithdrawal),
    parseHeader,
    postWithdrawal,
);
router.get(
    '/',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getWithdrawals),
    parseHeader,
    getWithdrawals,
);
router.get(
    '/:id',
    checkScopes(['admin', 'user']),
    validateAssetPoolHeader,
    validate(validations.getWithdrawal),
    parseHeader,
    getWithdrawal,
);
router.post(
    '/:id/vote',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.postVote),
    parseHeader,
    postVote,
);
router.delete(
    '/:id/vote',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.deleteVote),
    parseHeader,
    deleteVote,
);
router.post(
    '/:id/withdraw',
    checkScopes(['admin']),
    validateAssetPoolHeader,
    validate(validations.postPollFinalize),
    parseHeader,
    postPollFinalize,
);

export default router;
