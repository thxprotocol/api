import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadERC20 from './get.controller';
import ListERC20 from './list.controller';
import CreateERC20 from './post.controller';
import DeleteERC20 from './delete.controller';

const router = express.Router();

router.get('/', checkScopes(['erc20:read']), ListERC20.controller);
router.get('/:id', checkScopes(['erc20:read']), assertRequestInput(ReadERC20.validation), ReadERC20.controller);
router.post(
    '/',
    checkScopes(['erc20:write', 'erc20:read']),
    assertRequestInput(CreateERC20.validation),
    CreateERC20.controller,
);
router.delete('/:id', checkScopes(['erc20:write']), assertRequestInput(DeleteERC20.validation), DeleteERC20.controller);

export default router;
