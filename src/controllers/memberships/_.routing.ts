import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getMembership } from './get.action';
import { getMemberships } from './getAll.action';
import { deleteMembership } from './delete.action';

const router = express.Router();

router.get('/', checkScopes(['user', 'dashboard']), getMemberships);
router.get('/:id', checkScopes(['user', 'dashboard']), validate(validations.getMembership), getMembership);
router.delete('/:id', checkScopes(['user', 'dashboard']), validate(validations.deleteMembership), deleteMembership);

export default router;
