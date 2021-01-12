import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getMember } from './get.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import { parseHeader } from '../../util/network';

const router = express.Router();

router.post('/', validate(validations.postMember), parseHeader, postMember);
router.patch('/:address', validate(validations.patchMember), parseHeader, patchMember);
router.delete('/:address', validate(validations.deleteMember), parseHeader, deleteMember);
router.get('/:address', validate(validations.getMember), parseHeader, getMember);

export default router;
