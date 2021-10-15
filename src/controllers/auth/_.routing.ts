import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { postSignup } from './postSignup.action';
import { postAuthenticationToken } from './postAuthenticationToken.action';
import checkScopes from 'express-jwt-authz';
import { parseHeader } from '../../util/network';

const router = express.Router();

router.post('/signup', validate(validations.postSignup), checkScopes(['admin']), parseHeader, postSignup);
router.post(
    '/authentication_token',
    validate(validations.postAuthenticationToken),
    checkScopes(['admin']),
    postAuthenticationToken,
);

export default router;
