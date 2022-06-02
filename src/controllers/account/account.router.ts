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
import { dashboardScopes, userDashboardScopes, adminScopes } from '../scopes';

const router = express.Router();

router.get('/', assertScopes(userDashboardScopes), ReadAccount.controller);
router.patch('/', assertScopes(userDashboardScopes), UpdateAccount.controller);
router.delete('/', assertScopes(userDashboardScopes), DeleteAccount.controller);
router.post(
    '/',
    assertScopes(adminScopes),
    assertRequestInput(CreateAccount.validation),
    requireAssetPoolHeader,
    CreateAccount.controller,
);

router.get('/twitter', assertScopes(dashboardScopes), ReadAccountTwitter.controller);
router.get('/youtube', assertScopes(dashboardScopes), ReadAccountYoutube.controller);
router.get('/spotify', assertScopes(dashboardScopes), ReadAccountSpotify.controller);

router.post(
    '/login',
    assertRequestInput(CreateAccountLogin.validation),
    assertScopes(adminScopes),
    CreateAccountLogin.controller,
);

export default router;
