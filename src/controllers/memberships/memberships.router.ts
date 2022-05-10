import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadMembership from './get.controller';
import DeleteMembership from './delete.controller';
import ListMemberships from './list.controller';

const router = express.Router();

router.get('/', checkScopes(['user']), ListMemberships.controller);
router.get('/:id', checkScopes(['user']), assertRequestInput(ReadMembership.validation), ReadMembership.controller);
router.delete(
    '/:id',
    checkScopes(['user']),
    assertRequestInput(DeleteMembership.validation),
    DeleteMembership.controller,
);

export default router;
