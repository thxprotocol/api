import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadERC20 from './get.controller';
import ListERC20 from './list.controller';
import CreateERC20 from './post.controller';
import DeleteERC20 from './delete.controller';

const router = express.Router();

router.get('/', ListERC20.controller);
router.get('/:id', checkScopes(['dashboard', 'user']), assertRequestInput(ReadERC20.validation), ReadERC20.controller);
router.post('/', checkScopes(['dashboard']), assertRequestInput(CreateERC20.validation), CreateERC20.controller);
router.delete('/:id', checkScopes(['dashboard']), assertRequestInput(DeleteERC20.validation), DeleteERC20.controller);

export default router;
