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
import router from './router';

const MongoStore = mongo(session);
const app = express();
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
        origin: 'https://localhost:8080', // Multiple clients should be able to use this API.
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
app.use(`/${VERSION}`, router);

export default app;
