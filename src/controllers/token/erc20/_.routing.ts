import express from 'express';
import { postCreateToken } from './post.create.action';

const router = express.Router();

router.post('/', postCreateToken);

export default router;
