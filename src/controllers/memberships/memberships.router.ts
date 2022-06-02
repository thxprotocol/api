import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadMembership from './get.controller';
import DeleteMembership from './delete.controller';
import ListMemberships from './list.controller';
import { userScopes } from '../scopes';

const router = express.Router();

router.get('/', checkScopes(userScopes), ListMemberships.controller);
router.get('/:id', checkScopes(userScopes), assertRequestInput(ReadMembership.validation), ReadMembership.controller);
router.delete(
    '/:id',
    checkScopes(userScopes),
    assertRequestInput(DeleteMembership.validation),
    DeleteMembership.controller,
);

export default router;
