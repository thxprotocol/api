import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { getPoll } from './get.action';
import { postVote } from './postVote.action';
import { deleteVote } from './deleteVote.action';
import { postPollFinalize } from './postPollFinalize.action';

const router = express.Router();

router.get('/:address', validate(validations.getPoll), getPoll);
router.post('/:address/vote', validate(validations.postVote), postVote);
router.delete('/:address/vote', validate(validations.deleteVote), deleteVote);
router.post('/:address/finalize', validate(validations.postPollFinalize), postPollFinalize);

export default router;
