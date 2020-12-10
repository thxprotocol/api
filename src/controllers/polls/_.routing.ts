import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getPoll } from './get.action';
import { postPollFinalize } from './postPollFinalize.action';
import { getVote } from './getVote.action';
import { getRevokeVote } from './getRevokeVote.action';
import { postVote } from './postVote.action';
import { deleteVote } from './delete.action';
import { getPollFinalize } from './getPollFinalize.action';

const router = express.Router();

router.get('/:address', validate(validations.getPoll), getPoll);
router.get('/:address/vote/:agree', validate(validations.getVote), getVote);
router.get('/:address/revoke_vote', validate(validations.getRevokeVote), getRevokeVote);
router.get('/:address/finalize', validate(validations.getPollFinalize), getPollFinalize);
router.post('/:address/vote', validate(validations.postVote), postVote);
router.delete('/:address/vote', validate(validations.deleteVote), deleteVote);
// router.post('/:address/finalize', validate(validations.postPollFinalize), postPollFinalize);

export default router;
