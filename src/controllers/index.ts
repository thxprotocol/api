import * as passportConfig from '../config/passport';
import express from 'express';

import healthRouter from './health/_.routing';
import authRouter from './auth/_.routing';
import docsRouter from './docs/_.routing';
import accountRouter from './account/_.routing';
import assetPoolsRouter from './asset_pools/_.routing';
import gasStationRouter from './gas_station/_.routing';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import pollsRouter from './polls/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';

const router = express.Router();

router.use('/', authRouter);
router.use('/health', healthRouter);
router.use('/docs', docsRouter);
router.use(passportConfig.isAuthenticated);
router.use('/account', accountRouter);
router.use('/gas_station', gasStationRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
