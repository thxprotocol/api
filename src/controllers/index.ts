import express from 'express';
import healthRouter from './health/health.router';
import metricsRouter from './metrics/_.routing';
import docsRouter from './docs/docs.router';
import accountRouter from './account/account.router';
import authRouter from './auth/auth.router';
import widgetsRouter from './widgets/_.routing';
import gasStationRouter from './gas_station/gasStation.router';
import assetPoolsRouter from './asset_pools/assetPools.router';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';
import membershipsRouter from './memberships/_.routing';
import tokenRouter from './token/_.routing';
import promoCodesRouter from './promo_codes/promoCodes.router';
import depositsRouter from './deposits/deposits.router';
import { checkJwt } from '@/util/jwt';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use(checkJwt);
router.use('/', authRouter);
router.use('/promo_codes', promoCodesRouter);
router.use('/deposits', depositsRouter);
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
