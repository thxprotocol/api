import express from 'express';
import { validate } from '../../util/validation';
import { validations } from './_.validation';

import { postSignup } from './postSignup.action';
import { postForgot } from './postForgot.action';
import { postReset } from './postReset.action';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.post('/signup', validate(validations.postSignup), checkScopes(['admin', 'user']), postSignup);
router.post('/forgot', validate(validations.postForgot), checkScopes(['user']), postForgot);
router.post('/reset/:token', validate(validations.postReset), checkScopes(['user']), postReset);

export default router;
