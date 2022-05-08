import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { validations } from './_.validation';
import { getMembership } from './get.controller';
import { getMemberships } from './list.controller';
import { deleteMembership } from './delete.controller';

const router = express.Router();

router.get('/', checkScopes(['user']), getMemberships);
router.get('/:id', checkScopes(['user']), validate(validations.getMembership), getMembership);
router.delete('/:id', checkScopes(['user']), validate(validations.deleteMembership), deleteMembership);

export default router;
