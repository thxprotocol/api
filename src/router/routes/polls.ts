import express from 'express';
import * as pollController from '../../controllers/poll';
import { validate } from '../../util/validation';

const router = express.Router();

router.get('/:address', validate.getPoll, pollController.getPoll);
router.get('/:address/vote/:agree', validate.getVote, pollController.getVote);
router.get('/:address/revoke_vote', validate.getRevokeVote, pollController.getRevokeVote);
router.post('/:address/vote', validate.postVote, pollController.postVote);
router.delete('/:address/vote', validate.deleteVote, pollController.deleteVote);
router.post('/:address/finalize', validate.postPollFinalize, pollController.postPollFinalize);

export default router;
