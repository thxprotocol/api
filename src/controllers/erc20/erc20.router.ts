import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { getById, getERC20TokenValidation } from './get.controller';
import { getAllERC20Token } from './getAll.controller';
import { CreateERC20Controller, postERC20TokenValidation } from './post.controller';
import { deleteERC20TokenValidation, DeleteERC20Controller } from './delete.controller';

const router = express.Router();

router.get('/', getAllERC20Token);
router.get('/:id', checkScopes(['dashboard']), validate(getERC20TokenValidation), getById);
router.post('/', checkScopes(['dashboard']), validate(postERC20TokenValidation), CreateERC20Controller);
router.delete('/:id', checkScopes(['dashboard']), validate(deleteERC20TokenValidation), DeleteERC20Controller);

export default router;
