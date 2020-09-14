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

const MongoStore = mongo(session);

// Controllers
import * as accountController from './controllers/account';
import * as rewardPoolController from './controllers/rewardPool';
import * as rewardRuleController from './controllers/rewardRule';
import * as rewardController from './controllers/reward';

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
router.post('/account/profile', validate.postUpdateProfile, accountController.postUpdateProfile);
router.post('/account/password', validate.postUpdatePassword, accountController.postUpdatePassword);
router.delete('/account', accountController.deleteAccount);

// Reward Pools
router.get('/reward_pools/:address', validate.getRewardPools, rewardPoolController.getRewardPool);
router.post('/reward_pools/', validate.postRewardPools, rewardPoolController.postRewardPool);
router.post(
    '/reward_pools/:address/deposit',
    validate.postRewardPoolDeposit,
    rewardPoolController.postRewardPoolDeposit,
);

// Reward Rules
router.get('/reward_rules/:id/claim', validate.getRewardRuleClaim, rewardRuleController.getRewardRuleClaim);
router.get('/reward_rules/:id', validate.postRewardRule, rewardRuleController.getRewardRule);
router.post('/reward_rules', validate.postRewardRule, rewardRuleController.postRewardRule);

// Rewards
router.get('/rewards', validate.getReward, rewardController.getReward);
router.get('/rewards/:id', validate.getReward, rewardController.getReward);
router.post('/rewards', rewardController.postReward);

app.use(`/${VERSION}`, router);

export default app;
