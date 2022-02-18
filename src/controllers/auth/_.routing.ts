import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validations } from './_.validation';
import { postAccount } from '@/controllers/account/post.controller';
import { postLogin } from '@/controllers/account/login/post.controller';
import { parseHeader } from '@/util/network';
import { validate } from '@/util/validation';

const router = express.Router();

// These endpoints will be deprecated soon.
router.post('/signup', validate(validations.postSignup), checkScopes(['admin']), parseHeader, postAccount);
router.post('/authentication_token', validate(validations.postAuthenticationToken), checkScopes(['admin']), postLogin);

export default router;
