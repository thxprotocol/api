import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

import accountRouter from './routes/account';
import assetPoolsRouter from './routes/assetPools';
import membersRouter from './routes/members';
import rewardsRouter from './routes/rewards';
import withdrawalsRouter from './routes/withdrawals';
import pollsRouter from './routes/polls';

// Controllers
import * as accountController from '../controllers/account';

// API keys and Passport configuration
import * as passportConfig from '../config/passport';
import { validate } from '../util/validation';

const router = express.Router();

// Docs
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

// Auth
router.post('/signup', validate.postSignup, accountController.postSignup);
router.post('/forgot', validate.postForgot, accountController.postForgot);
router.post('/reset/:token', validate.postReset, accountController.postReset);
router.post('/login', validate.postLogin, accountController.postLogin);
router.get('/logout', accountController.logout);

router.use(passportConfig.isAuthenticated);

router.use('/account', accountRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
