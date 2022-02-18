import express from 'express';
import assertScopes from 'express-jwt-authz';
import { getAccount } from './get.controller';
import { patchAccount } from './patch.controller';
import { deleteAccount } from './delete.controller';
import { createAccountValidation, postAccount } from './post.controller';
import { getYoutube } from './youtube/get.controller';
import { getTwitter } from './twitter/get.controller';
import { createLoginValidation, postLogin } from './login/post.controller';
import { assertRequestInput } from '@/middlewares';
import { requireAssetPoolHeader } from '@/middlewares';

const router = express.Router();

router.get('/', assertScopes(['user', 'dashboard']), getAccount);
router.patch('/', assertScopes(['user', 'dashboard']), patchAccount);
router.delete('/', assertScopes(['user', 'dashboard']), deleteAccount);
router.post(
    '/',
    assertRequestInput(createAccountValidation),
    assertScopes(['admin']),
    requireAssetPoolHeader,
    postAccount,
);
router.get('/twitter', assertScopes(['dashboard']), getTwitter);
router.get('/youtube', assertScopes(['dashboard']), getYoutube);
router.post('/login', assertRequestInput(createLoginValidation), assertScopes(['admin']), postLogin);

export default router;
