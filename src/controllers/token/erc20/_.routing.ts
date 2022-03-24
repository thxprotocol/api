import express from 'express';
import checkScopes from 'express-jwt-authz';

import { checkJwt } from '@/middlewares';
import { validate } from '@/util/validation';

import validation from './_.validation';
import { getById } from './get.action';
import { getAllERC20Token } from './get.all.action';
import { postCreateToken } from './post.create.action';

const router = express.Router();

router.use(checkJwt);

router.get('/', getAllERC20Token);
router.get('/:id', checkScopes(['dashboard']), validate(validation.getERC20Token), getById);
router.post('/', checkScopes(['dashboard']), validate(validation.postERC20Token), postCreateToken);

export default router;
