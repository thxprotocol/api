import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { getById, getERC20TokenValidation } from './get.controller';
import { getAllERC20Token } from './getAll.controller';
import { postCreateToken, postERC20TokenValidation } from './post.controller';
import { postERC20TokenAddToPool, postERC20TokenAddToPoolValidation } from './post.addToPool.controller';

const router = express.Router();

router.get('/', getAllERC20Token);
router.get('/:id', checkScopes(['dashboard']), validate(getERC20TokenValidation), getById);
router.post('/', checkScopes(['dashboard']), validate(postERC20TokenValidation), postCreateToken);
router.post(
    '/add_to_pool',
    checkScopes(['dashboard']),
    validate(postERC20TokenAddToPoolValidation),
    postERC20TokenAddToPool,
);

export default router;
