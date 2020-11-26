import express from 'express';
import * as pollController from '../../controllers/poll';
import { validations, validate } from '../../util/validation';

const router = express.Router();

router.get('/:address', validate(validations.getPoll), pollController.getPoll);
router.get('/:address/vote/:agree', validate(validations.getVote), pollController.getVote);
router.get('/:address/revoke_vote', validate(validations.getRevokeVote), pollController.getRevokeVote);
router.post('/:address/vote', validate(validations.postVote), pollController.postVote);
router.delete('/:address/vote', validate(validations.deleteVote), pollController.deleteVote);
router.post('/:address/finalize', validate(validations.postPollFinalize), pollController.postPollFinalize);

export default router;
