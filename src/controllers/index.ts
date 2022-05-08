import express from 'express';
import healthRouter from './health/health.router';
import metricsRouter from './metrics/metrics.router';
import docsRouter from './docs/docs.router';
import accountRouter from './account/account.router';
import authRouter from './auth/auth.router';
import widgetsRouter from './widgets/widgets.router';
import relayHubRouter from './relay/relay-hub.router';
import poolsRouter from './pools/pools.router';
import membersRouter from './members/members.router';
import rewardsRouter from './rewards/reward.router';
import withdrawalsRouter from './withdrawals/withdrawals.router';
import membershipsRouter from './memberships/memberships.router';
import tokenRouter from './token/token.router';
import promotionsRouter from './promotions/promotions.router';
import depositsRouter from './deposits/deposits.router';
import erc721Router from './erc721/erc721.router';
import erc721MetadataRouter from './erc721/metadata/metadata.router';
import erc20Router from './erc20/erc20.router';
import { checkJwt } from '@/middlewares';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use('/metadata', erc721MetadataRouter);
router.use(checkJwt);
router.use('/', authRouter);
router.use('/erc20', erc20Router);
router.use('/metrics', metricsRouter);
router.use('/pools', poolsRouter);
router.use('/promotions', promotionsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/account', accountRouter);
router.use('/widgets', widgetsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/deposits', depositsRouter);
router.use('/relay', relayHubRouter);
router.use('/memberships', membershipsRouter);
router.use('/erc721', erc721Router);

router.use('/asset_pools', poolsRouter); // TODO Deprecate when implemented in Dashboard
router.use('/promo_codes', promotionsRouter); // TODO Deprecate when implemented in Dashboard and Web Wallet

export default router;
