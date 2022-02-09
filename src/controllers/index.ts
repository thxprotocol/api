import express from 'express';
import healthRouter from './health/_.routing';
import metricsRouter from './metrics/_.routing';
import docsRouter from './docs/_.routing';
import accountRouter from './account/_.routing';
import authRouter from './auth/_.routing';
import widgetsRouter from './widgets/_.routing';
import assetPoolsRouter from './asset_pools/_.routing';
import gasStationRouter from './gas_station/_.routing';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';
import membershipsRouter from './memberships/_.routing';
import tokenRouter from './token/_.routing';
import { checkJwt } from '../util/jwt';
import { ignoreTransaction } from '../util/newrelic';

const router = express.Router();

router.use('/ping', (_req, res) => {
    ignoreTransaction();
    res.send('pong');
});
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use(checkJwt);
router.use('/', authRouter);
router.use('/metrics', metricsRouter);
router.use('/account', accountRouter);
router.use('/widgets', widgetsRouter);
router.use('/gas_station', gasStationRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/memberships', membershipsRouter);

export default router;
