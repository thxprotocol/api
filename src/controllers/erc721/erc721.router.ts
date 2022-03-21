import { assertRequestInput } from '@/middlewares';
import express from 'express';
import assertScopes from 'express-jwt-authz';
import { createERC721Validation, CreateERC721Controller } from './post.controller';

const router = express.Router();

router.post('/', assertScopes(['dashboard']), assertRequestInput(createERC721Validation), CreateERC721Controller);

export default router;
