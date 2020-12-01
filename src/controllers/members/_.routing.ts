import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getMember } from './get.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';

const router = express.Router();

router.post('/', validate(validations.postMember), postMember);
router.patch('/:address', validate(validations.patchMember), patchMember);
router.delete('/:address', validate(validations.deleteMember), deleteMember);
router.get('/:address', validate(validations.getMember), getMember);

export default router;
