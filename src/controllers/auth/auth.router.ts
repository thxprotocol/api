import express from 'express';
import assertScopes from 'express-jwt-authz';
import { createAccountValidation, postAccount } from '@/controllers/account/post.controller';
import { createLoginValidation, postLogin } from '@/controllers/account/login/post.controller';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';

const router = express.Router();

// These endpoints will be deprecated soon.
router.post(
    '/signup',
    assertScopes(['admin']),
    assertRequestInput(createAccountValidation),
    requireAssetPoolHeader,
    postAccount,
);
router.post('/authentication_token', assertRequestInput(createLoginValidation), assertScopes(['admin']), postLogin);

export default router;
