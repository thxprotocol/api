import express from 'express';
import ListController from './list.controller';
import GetController from './get.controller';
import PostController from './post.controller';
import { assertAssetPoolAccess } from '@/middlewares';

const router = express.Router();

router.get('/', assertAssetPoolAccess, ListController.controller);
router.get('/:id', assertAssetPoolAccess, GetController.controller);
router.post('/', assertAssetPoolAccess, PostController.controller);

export default router;
