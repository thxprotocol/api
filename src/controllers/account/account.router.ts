import express from 'express';
import assertScopes from 'express-jwt-authz';
import { assertRequestInput, requireAssetPoolHeader } from '@/middlewares';
import CreateAccount from './post.controller';
import ReadAccount from './get.controller';
import UpdateAccount from './patch.controller';
import DeleteAccount from './delete.controller';
import ReadAccountYoutube from './youtube/get.controller';
import ReadAccountTwitter from './twitter/get.controller';
import ReadAccountSpotify from './spotify/get.controller';
import CreateAccountLogin from './login/post.controller';

const router = express.Router();

router.get('/', assertScopes(['user', 'dashboard']), ReadAccount.controller);
router.patch('/', assertScopes(['user', 'dashboard']), UpdateAccount.controller);
router.delete('/', assertScopes(['user', 'dashboard']), DeleteAccount.controller);
router.post(
    '/',
    assertScopes(['admin']),
    assertRequestInput(CreateAccount.validation),
    requireAssetPoolHeader,
    CreateAccount.controller,
);
router.get('/twitter', assertScopes(['dashboard']), ReadAccountTwitter.controller);
router.get('/youtube', assertScopes(['dashboard']), ReadAccountYoutube.controller);
router.get('/spotify', assertScopes(['dashboard']), ReadAccountSpotify.controller);
router.post(
    '/login',
    assertRequestInput(CreateAccountLogin.validation),
    assertScopes(['admin']),
    CreateAccountLogin.controller,
);

export default router;
