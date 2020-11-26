import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import * as accountController from '../controllers/account';
import * as passportConfig from '../config/passport';
import { validations, validate } from '../util/validation';

import accountRouter from './routes/account';
import assetPoolsRouter from './routes/assetPools';
import membersRouter from './routes/members';
import rewardsRouter from './routes/rewards';
import withdrawalsRouter from './routes/withdrawals';
import pollsRouter from './routes/polls';

const router = express.Router();

// Docs
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

// Auth
router.post('/signup', validate(validations.postSignup), accountController.postSignup);
router.post('/forgot', validate(validations.postForgot), accountController.postForgot);
router.post('/reset/:token', validate(validations.postReset), accountController.postReset);
router.post('/login', validate(validations.postLogin), accountController.postLogin);
router.get('/logout', accountController.logout);

router.use(passportConfig.isAuthenticated);

router.use('/account', accountRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
