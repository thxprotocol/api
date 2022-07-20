import express from 'express';
import GetController from './get.controller';
import PostInfoController from './post.info.controller';
import PostController from './post.controller';

const router = express.Router();

router.get('/', GetController.controller);
router.post('/info', PostInfoController.controller);
router.post('/', PostController.controller);

export default router;
