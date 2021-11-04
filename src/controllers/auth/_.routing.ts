import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { parseHeader } from '../../util/network';
import checkScopes from 'express-jwt-authz';

import { postAccount } from '../account/post.action';
import { postLogin } from '../account/postLogin.action';

const router = express.Router();

// These endpoints will be deprecated soon.
router.post('/signup', validate(validations.postSignup), checkScopes(['admin']), parseHeader, postAccount);
router.post('/authentication_token', validate(validations.postAuthenticationToken), checkScopes(['admin']), postLogin);

export default router;
