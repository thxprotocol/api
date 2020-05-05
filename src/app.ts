import express from 'express';
import compression from 'compression';
import session from 'express-session';
import bodyParser from 'body-parser';
import lusca from 'lusca';
import flash from 'express-flash';
import path from 'path';
import { SESSION_SECRET } from './util/secrets';

import * as apiController from './controllers/api';
import * as slackController from './controllers/slack';

const app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: SESSION_SECRET,
    }),
);
app.use(flash());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * API routes.
 */
app.post('/api/rewards', apiController.postReward);
app.get('/api', apiController.getAPI);
app.get('/api/rules', apiController.getRewardRules);
app.get('/api/rules/:id', apiController.getRewardRule);
app.get('/api/qr/connect/:pool/:slack', apiController.getQRConnect);
app.get('/api/qr/reward/:pool/:rule/:key', apiController.getQRReward);

/**
 * Slack Proxy routes.
 */
app.get('/slack', slackController.getSlack);
app.post('/slack/connect', slackController.connectAccount);
app.post('/slack/rules', slackController.getRewardRules);
app.post('/slack/reward', slackController.sendReward);

export default app;
