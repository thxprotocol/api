import express from 'express';
import healthRouter from './health/health.router';
import metricsRouter from './metrics/_.routing';
import docsRouter from './docs/docs.router';
import accountRouter from './account/account.router';
import authRouter from './auth/auth.router';
import widgetsRouter from './widgets/_.routing';
import relayHubRouter from './relay/relayHub.router';
import assetPoolsRouter from './asset_pools/assetPools.router';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';
import membershipsRouter from './memberships/_.routing';
import tokenRouter from './token/_.routing';
import promoCodesRouter from './promo_codes/promoCodes.router';
import depositsRouter from './deposits/deposits.router';
import erc20Router from './erc20/erc20.router';

import { checkJwt } from '@/middlewares';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use(checkJwt);
router.use('/', authRouter);
router.use('/erc20', erc20Router);
router.use('/metrics', metricsRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/promo_codes', promoCodesRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/account', accountRouter);
router.use('/widgets', widgetsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/deposits', depositsRouter);
router.use('/relay', relayHubRouter);
router.use('/memberships', membershipsRouter);

export default router;
