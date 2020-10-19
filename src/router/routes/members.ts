import express from 'express';
import * as memberController from '../../controllers/member';
import { validate } from '../../util/validation';

const router = express.Router();

router.post('/', validate.postMember, memberController.postMember);
router.patch('/:address', validate.patchMember, memberController.patchMember);
router.delete('/:address', validate.deleteMember, memberController.deleteMember);
router.get('/:address', validate.getMember, memberController.getMember);

export default router;
