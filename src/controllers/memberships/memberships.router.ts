import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadMembership from './get.controller';
import DeleteMembership from './delete.controller';
import ListMemberships from './list.controller';

const router = express.Router();

router.get('/', checkScopes(['memberships:read']), ListMemberships.controller);
router.get(
    '/:id',
    checkScopes(['memberships:read']),
    assertRequestInput(ReadMembership.validation),
    ReadMembership.controller,
);
router.delete(
    '/:id',
    checkScopes(['memberships:write']),
    assertRequestInput(DeleteMembership.validation),
    DeleteMembership.controller,
);

export default router;
