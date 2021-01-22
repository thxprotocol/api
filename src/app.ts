import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import lusca from 'lusca';
import path from 'path';
import router from './controllers';
import db from './util/database';
import { requestLogger } from './util/logger';
import { errorHandler, notFoundHandler } from './util/error';
import { corsHandler } from './util/cors';
import { oidc, router as oidcRouter } from './oidc';
import { PORT, VERSION, MONGODB_URI } from './util/secrets';

const app = express();

db.connect(MONGODB_URI);

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../src/views'));
app.set('port', PORT);
app.use(corsHandler);
app.use(requestLogger);
app.use(compression());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/', oidcRouter);
app.use(`/${VERSION}`, bodyParser.json());
app.use(`/${VERSION}`, bodyParser.urlencoded({ extended: false }));
app.use(`/${VERSION}`, router);
app.use('/', oidc.callback);
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
