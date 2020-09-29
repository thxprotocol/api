import express from 'express';
import compression from 'compression';
import session from 'express-session';
import bodyParser from 'body-parser';
import mongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import bluebird from 'bluebird';
import lusca from 'lusca';
import path from 'path';
import { MONGODB_URI, VERSION, SESSION_SECRET } from './util/secrets';
import morgan from 'morgan';
import logger from './util/logger';
import cors from 'cors';

const MongoStore = mongo(session);

// Controllers
import * as accountController from './controllers/account';
import * as assetPoolController from './controllers/assetPool';
import * as rewardController from './controllers/reward';
import * as withdrawalController from './controllers/withdrawal';
import * as memberController from './controllers/member';

// API keys and Passport configuration
import * as passportConfig from './config/passport';
import { validate } from './util/validation';

const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).catch((err) => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    process.exit();
});
app.set('port', process.env.PORT || 3000);
app.use(
    cors({
        credentials: true,
        origin: 'https://localhost:8080',
    }),
);
app.use(morgan('combined', { stream: { write: (message: any) => logger.info(message) } }));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: SESSION_SECRET,
        store: new MongoStore({
            url: mongoUrl,
            autoReconnect: true,
        }),
    }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

const router = express.Router();

// Auth
router.post('/signup', validate.postSignup, accountController.postSignup);
router.post('/forgot', accountController.postForgot);
router.post('/reset/:token', validate.postReset, accountController.postReset);
router.post('/login', validate.postLogin, accountController.postLogin);
router.get('/logout', accountController.logout);

// All protected routes below this line
router.use(passportConfig.isAuthenticated);

// Account
router.get('/account', accountController.getAccount);
router.post('/account/profile', accountController.postUpdateProfile);
router.post('/account/password', validate.postUpdatePassword, accountController.postUpdatePassword);
router.delete('/account', accountController.deleteAccount);

// Asset Pools
router.get('/asset_pools/:address', validate.getAssetPools, assetPoolController.getAssetPool);
router.post('/asset_pools/', validate.postAssetPools, assetPoolController.postAssetPool);
router.post('/asset_pools/:address/deposit', validate.postAssetPoolDeposit, assetPoolController.postAssetPoolDeposit);

// Rewards
router.post('/members', validate.postMember, memberController.postMember);
router.delete('/members/:address', validate.deleteMember, memberController.deleteMember);
router.get('/members/:address', validate.getMember, memberController.getMember);

// Rewards
router.get('/rewards/:id/claim', validate.getRewardClaim, rewardController.getRewardClaim);
router.get('/rewards/:id', validate.getReward, rewardController.getReward);
router.post('/rewards', validate.postReward, rewardController.postReward);

// Withdrawals
router.get('/withdrawals', validate.getWithdrawals, withdrawalController.getWithdrawals);
router.get('/withdrawals/:address', validate.getWithdrawal, withdrawalController.getWithdrawal);
router.get('/withdrawals/:address/vote/:agree', validate.getWithdrawalVote, withdrawalController.getWithdrawalVote);
router.get(
    '/withdrawals/:address/revoke_vote',
    validate.getWithdrawalRevokeVote,
    withdrawalController.getWithdrawalRevokeVote,
);
router.post('/withdrawals/:address/vote', validate.postWithdrawalVote, withdrawalController.postWithdrawalVote);
router.delete('/withdrawals/:address/vote', validate.deleteWithdrawalVote, withdrawalController.deleteWithdrawalVote);
router.post('/withdrawals', validate.postWithdrawal, withdrawalController.postWithdrawal);

app.use(`/${VERSION}`, router);

export default app;
