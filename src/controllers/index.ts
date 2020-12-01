import express from 'express';
import * as passportConfig from '../config/passport';

import authRouter from './auth/_.routing';
import docsRouter from './docs/_.routing';
import accountRouter from './account/_.routing';
import assetPoolsRouter from './asset_pools/_.routing';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import pollsRouter from './polls/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';

const router = express.Router();

router.use('/', authRouter);
router.use('/docs', docsRouter);
router.use(passportConfig.isAuthenticated);
router.use('/account', accountRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
