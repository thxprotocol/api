import express from "express";
import compression from "compression";
import session from "express-session";
import bodyParser from "body-parser";
import mongo from "connect-mongo";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import lusca from "lusca";
import path from "path";
import { MONGODB_URI, VERSION, SESSION_SECRET } from "./util/secrets";

const MongoStore = mongo(session);

// Controllers
import * as accountController from "./controllers/account";
import * as apiController from "./controllers/api";
import * as slackController from "./controllers/slack";

// API keys and Passport configuration
import * as passportConfig from "./config/passport";

const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } ).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    // process.exit();
});

app.set("port", process.env.PORT || 3000);
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
            autoReconnect: true
        })
    }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

// function auth(req: any, res: any, next: any) {
//     if (!req.headers["x-api-key"]) {
//         return res.status(403).json({ error: "No API Key provided!" });
//     } else if (req.headers["x-api-key"] !== process.env.API_KEY) {
//         return res.status(403).json({ error: "Incorrect API Key provided." });
//     }
//     next();
// };

/**
 * Slack Proxy routes.
 */
app.get(`/${VERSION}/proxy/slack`, slackController.getSlack);
app.post(`/${VERSION}/proxy/slack/connect`, slackController.connectAccount);
app.post(`/${VERSION}/proxy/slack/rules`, slackController.getRewardRules);
app.post(`/${VERSION}/proxy/slack/reward`, slackController.sendReward);
app.get(`/${VERSION}/qr/reward/:pool/:rule/:key`, apiController.getQRReward);
app.get(`/${VERSION}/qr/connect/:pool/:slack`, apiController.getQRConnect);

/**
 * API routes.
 */
app.get(`/${VERSION}`, apiController.getAPI);

app.post(`/${VERSION}/login`, accountController.postLogin);
app.post(`/${VERSION}/forgot`, accountController.postForgot);
app.post(`/${VERSION}/reset/:token`, accountController.postReset);
app.post(`/${VERSION}/signup`, accountController.postSignup);

app.get(`/${VERSION}/account`, passportConfig.isAuthenticated, accountController.getAccount);
app.post(`/${VERSION}/account/profile`, passportConfig.isAuthenticated, accountController.postUpdateProfile);
app.post(`/${VERSION}/account/password`, passportConfig.isAuthenticated, accountController.postUpdatePassword);
app.post(`/${VERSION}/account/delete`, passportConfig.isAuthenticated, accountController.postDeleteAccount);

app.post(`/${VERSION}/rewards`, apiController.postReward);
app.get(`/${VERSION}/rewardrules`, apiController.getRewardRules);
app.get(`/${VERSION}/rewardrules/:id`, apiController.getRewardRule);
app.get(`/${VERSION}/members`, apiController.getMembers);
app.get(`/${VERSION}/members/:id`, apiController.getMember);

export default app;
