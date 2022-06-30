import express from 'express';
import healthRouter from './health/health.router';
import metricsRouter from './metrics/metrics.router';
import docsRouter from './docs/docs.router';
import accountRouter from './account/account.router';
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
import paymentsRouter from './payments/payments.router';
import erc721Router from './erc721/erc721.router';
import erc721MetadataRouter from './erc721/metadata/metadata.router';
import uploadRouter from './upload/upload.router';
import erc20Router from './erc20/erc20.router';
import transactionsRouter from './transactions/transactions.router';
<<<<<<< HEAD
import erc20SwapRuleRouter from './swaprules/swaprules.router';
import erc20SwapRouter from './swaps/swaps.router';
=======
import arweaveRouter from './arweave/arweave.router';
>>>>>>> 3ebe5f3b (feat: add tests for arweave)
import brandRouter from './brand/brand.router';
import { checkJwt } from '@/middlewares';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use('/metadata', erc721MetadataRouter);
router.use('/payments', paymentsRouter);
router.use(checkJwt);
router.use('/account', accountRouter);
router.use('/pools', poolsRouter);
router.use('/metrics', metricsRouter);
router.use('/erc20', erc20Router);
router.use('/erc721', erc721Router);
router.use('/deposits', depositsRouter);
router.use('/members', membersRouter);
router.use('/memberships', membershipsRouter);
router.use('/promotions', promotionsRouter);
router.use('/relay', relayHubRouter);
router.use('/rewards', rewardsRouter);
router.use('/widgets', widgetsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/transactions', transactionsRouter);
router.use('/swaprules', erc20SwapRuleRouter);
router.use('/swaps', erc20SwapRouter);
router.use('/brand', brandRouter);
router.use('/upload', uploadRouter);
router.use('/arweave', arweaveRouter);
router.use('/transactions', transactionsRouter);

export default router;
