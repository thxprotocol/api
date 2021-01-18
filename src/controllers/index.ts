import { ISSUER } from '../util/secrets';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import express from 'express';
import healthRouter from './health/_.routing';
import docsRouter from './docs/_.routing';
import accountRouter from './account/_.routing';
import assetPoolsRouter from './asset_pools/_.routing';
import gasStationRouter from './gas_station/_.routing';
import membersRouter from './members/_.routing';
import rewardsRouter from './rewards/_.routing';
import pollsRouter from './polls/_.routing';
import withdrawalsRouter from './withdrawals/_.routing';
import authRouter from './auth/_.routing';
import jwks from '../jwks.json';

const router = express.Router();
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${ISSUER}/jwks`,
        getKeysInterceptor: (cb) => {
            return cb(null, jwks.keys as any);
        },
    }),
    issuer: ISSUER,
    algorithms: ['RS256'],
});

router.use('/health', healthRouter);
router.use('/docs', docsRouter);
router.use(checkJwt);
router.use('/', authRouter);
router.use('/account', accountRouter);
router.use('/gas_station', gasStationRouter);
router.use('/asset_pools', assetPoolsRouter);
router.use('/members', membersRouter);
router.use('/rewards', rewardsRouter);
router.use('/withdrawals', withdrawalsRouter);
router.use('/polls', pollsRouter);

export default router;
