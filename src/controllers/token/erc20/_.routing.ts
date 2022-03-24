import express from 'express';

import { validate } from '@/util/validation';

import validation from './_.validation';
import { getById } from './get.action';
import { getAllERC20Token } from './get.all.action';
import { postCreateToken } from './post.create.action';

const router = express.Router();

router.get('/', getAllERC20Token);
router.get('/:id', validate(validation.getERC20Token), getById);
router.post('/', validate(validation.postERC20Token), postCreateToken);

export default router;
