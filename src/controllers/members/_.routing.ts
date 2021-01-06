import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getMember } from './get.action';
import { postMember } from './post.action';
import { patchMember } from './patch.action';
import { deleteMember } from './delete.action';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.post('/', checkScopes(['admin']), validate(validations.postMember), postMember);
router.patch('/:address', checkScopes(['admin']), validate(validations.patchMember), patchMember);
router.delete('/:address', checkScopes(['admin']), validate(validations.deleteMember), deleteMember);
router.get('/:address', checkScopes(['admin', 'user']), validate(validations.getMember), getMember);

export default router;
