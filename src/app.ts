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

const MongoStore = mongo(session);

// Controllers
import * as accountController from './controllers/account';
import * as rewardPoolController from './controllers/rewardPool';
import * as rewardRuleController from './controllers/rewardRule';
import * as rewardController from './controllers/reward';
import * as pollController from './controllers/poll';
// import * as slackController from './controllers/slack';

// API keys and Passport configuration
import * as passportConfig from './config/passport';

const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).catch((err) => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    process.exit();
});
app.set('port', process.env.PORT || 3000);
app.use(morgan('combined'));
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

/**
 * Slack Proxy routes.
 */
// app.get(`/${VERSION}/proxy/slack`, slackController.getSlack);
// app.post(`/${VERSION}/proxy/slack/connect`, slackController.connectAccount);
// app.post(`/${VERSION}/proxy/slack/rules`, slackController.getRewardRules);
// app.post(`/${VERSION}/proxy/slack/reward`, slackController.sendReward);
// app.get(`/${VERSION}/qr/reward/:pool/:rule/:key`, apiController.getQRReward);
// app.get(`/${VERSION}/qr/connect/:pool/:slack`, apiController.getQRConnect);

/**
 * API routes.
 */
// app.get(`/${VERSION}`, apiController.getAPI);
const router = express.Router();

// Auth
router.post('/signup', accountController.postSignup);
router.post('/forgot', accountController.postForgot);
router.post('/reset/:token', accountController.postReset);
router.post('/login', accountController.postLogin);
router.get('/logout', accountController.logout);

// Account
router.get('/account', passportConfig.isAuthenticated, accountController.getAccount);
router.post('/account/profile', passportConfig.isAuthenticated, accountController.postUpdateProfile);
router.post('/account/password', passportConfig.isAuthenticated, accountController.postUpdatePassword);
router.delete('/account', passportConfig.isAuthenticated, accountController.deleteAccount);

// Reward Pools
router.get('/reward_pools/:address', rewardPoolController.getRewardPool);
router.post('/reward_pools/', rewardPoolController.postRewardPool);
router.post('/reward_pools/deposit', rewardPoolController.postRewardPoolDeposit);

// Rewards
router.get('/rewards/:id', rewardController.getReward);

router.get('/reward_rules/:id', rewardRuleController.getRewardRule);
router.post('/reward_rules', rewardRuleController.postRewardRule);

app.use(`/${VERSION}`, router);

export default app;
