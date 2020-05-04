import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import flash from "express-flash";
import path from "path";
import { SESSION_SECRET } from "./util/secrets";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as apiController from "./controllers/api";
import * as slackController from "./controllers/slack";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
}));
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);

/**
 * API routes.
 */
app.get("/api", apiController.getApi);

/**
 * Slack Proxy routes.
 */
app.post("/slack/connect", slackController.connectAccount);
app.post("/slack/rules", slackController.getRewardRules);
app.post("/slack/reward", slackController.sendReward);

export default app;
