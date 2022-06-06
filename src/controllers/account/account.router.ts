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

router.get('/', assertScopes(['account:read']), ReadAccount.controller);
router.patch('/', assertScopes(['account:read', 'account:write']), UpdateAccount.controller);
router.delete('/', assertScopes(['account:write']), DeleteAccount.controller);
router.post(
    '/',
    assertScopes(['account:write']),
    assertRequestInput(CreateAccount.validation),
    requireAssetPoolHeader,
    CreateAccount.controller,
);

router.get('/twitter', assertScopes(['account:read']), ReadAccountTwitter.controller);
router.get('/youtube', assertScopes(['account:read']), ReadAccountYoutube.controller);
router.get('/spotify', assertScopes(['account:read']), ReadAccountSpotify.controller);

router.post(
    '/login',
    assertRequestInput(CreateAccountLogin.validation),
    assertScopes(['account:write']),
    CreateAccountLogin.controller,
);

export default router;
