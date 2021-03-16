import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getWithdrawal } from './get.action';
import { getWithdrawals } from './getWithdrawals.action';
import { parseHeader } from '../../util/network';
import checkScopes from 'express-jwt-authz';
import { postVote } from './postVote.action';
import { postPollFinalize } from './postPollFinalize.action';
import { deleteVote } from './deleteVote.action';

const router = express.Router();

router.get('/', checkScopes(['admin', 'user']), validate(validations.getWithdrawals), parseHeader, getWithdrawals);
router.get('/:id', checkScopes(['admin', 'user']), validate(validations.getWithdrawal), parseHeader, getWithdrawal);
router.post('/:id/vote', checkScopes(['admin']), validate(validations.postVote), parseHeader, postVote);
router.delete('/:id/vote', checkScopes(['admin']), validate(validations.deleteVote), parseHeader, deleteVote);
router.post(
    '/:id/withdraw',
    checkScopes(['admin']),
    validate(validations.postPollFinalize),
    parseHeader,
    postPollFinalize,
);

export default router;
