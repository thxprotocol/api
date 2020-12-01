import { ORIGIN, VERSION, SESSION_SECRET, MONGODB_URI, ENVIRONMENT } from './util/secrets';
import express from 'express';
import compression from 'compression';
import session from 'express-session';
import bodyParser from 'body-parser';
import passport from 'passport';
import lusca from 'lusca';
import path from 'path';
import morgan from 'morgan';
import logger from './util/logger';
import cors from 'cors';
import router from './controllers';
import mongo from 'connect-mongo';
import db from './util/database';
import { errorHandler, notFoundHandler } from './util/error';

const app = express();
const MongoStore = mongo(session);

db.connect(MONGODB_URI);

app.set('port', process.env.PORT || 3000);
app.use(
    cors({
        credentials: true,
        origin: ORIGIN,
    }),
);
app.use(
    morgan('combined', {
        skip: () => ENVIRONMENT === 'test',
        stream: { write: (message: any) => logger.info(message) },
    }),
);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: SESSION_SECRET,
        store: new MongoStore({
            url: MONGODB_URI,
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
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
