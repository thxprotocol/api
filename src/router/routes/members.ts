import express from 'express';
import * as memberController from '../../controllers/member';
import { validations, validate } from '../../util/validation';

const router = express.Router();

router.post('/', validate(validations.postMember), memberController.postMember);
router.patch('/:address', validate(validations.patchMember), memberController.patchMember);
router.delete('/:address', validate(validations.deleteMember), memberController.deleteMember);
router.get('/:address', validate(validations.getMember), memberController.getMember);

export default router;
