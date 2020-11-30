import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import * as passportConfig from '../config/passport';
import { validations, validate } from '../util/validation';

import { postSignup } from '../controllers/account/signup.action';
import { postForgot } from '../controllers/account/forget.action';
import { postReset } from '../controllers/account/reset.action';
import { postLogin } from '../controllers/account/login.action';
import { getLogout } from '../controllers/account/logout.action';

import accountRouter from '../controllers/account/account.routing';
import assetPoolsRouter from '../controllers/asset_pools/asset_pools.routing';
import membersRouter from '../controllers/members/members.routing';

import rewardsRouter from './routes/rewards';
import withdrawalsRouter from './routes/withdrawals';
import pollsRouter from './routes/polls';

const router = express.Router();

// Docs
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

// Auth
router.post('/signup', validate(validations.postSignup), postSignup);
router.post('/forgot', validate(validations.postForgot), postForgot);
router.post('/reset/:token', validate(validations.postReset), postReset);
router.post('/login', validate(validations.postLogin), postLogin);
router.get('/logout', getLogout);

router.use(passportConfig.isAuthenticated);

router.use('/account', accountRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
