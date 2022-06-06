import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadERC20 from './get.controller';
import ListERC20 from './list.controller';
import ListERC20Token from './token/list.controller';
import ReadERC20Token from './token/get.controller';
import CreateERC20 from './post.controller';
import DeleteERC20 from './delete.controller';

const router = express.Router();

router.get('/token', checkScopes(['user']), ListERC20Token.controller);
router.get('/token/:id', checkScopes(['user']), ReadERC20Token.controller);

router.get('/', checkScopes(['dashboard']), ListERC20.controller);
router.get('/:id', checkScopes(['dashboard']), assertRequestInput(ReadERC20.validation), ReadERC20.controller);
router.post('/', checkScopes(['dashboard']), assertRequestInput(CreateERC20.validation), CreateERC20.controller);
router.delete('/:id', checkScopes(['dashboard']), assertRequestInput(DeleteERC20.validation), DeleteERC20.controller);

export default router;
