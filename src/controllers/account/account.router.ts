import express from 'express';

import { assertRequestInput, requireAssetPoolHeader, guard } from '@/middlewares';
import CreateAccount from './post.controller';
import ReadAccount from './get.controller';
import UpdateAccount from './patch.controller';
import DeleteAccount from './delete.controller';
import ReadAccountYoutube from './youtube/get.controller';
import ReadAccountTwitter from './twitter/get.controller';
import ReadAccountSpotify from './spotify/get.controller';
import CreateAccountLogin from './login/post.controller';

const router = express.Router();

router.get('/', guard.check(['account:read']), ReadAccount.controller);
router.patch('/', guard.check(['account:read', 'account:write']), UpdateAccount.controller);
router.delete('/', guard.check(['account:write']), DeleteAccount.controller);
router.post(
    '/',
    guard.check(['account:write']),
    assertRequestInput(CreateAccount.validation),
    requireAssetPoolHeader,
    CreateAccount.controller,
);

router.get('/twitter', guard.check(['account:read']), ReadAccountTwitter.controller);
router.get('/youtube', guard.check(['account:read']), ReadAccountYoutube.controller);
router.get('/spotify', guard.check(['account:read']), ReadAccountSpotify.controller);

router.post(
    '/login',
    assertRequestInput(CreateAccountLogin.validation),
    guard.check(['account:write']),
    CreateAccountLogin.controller,
);

export default router;
