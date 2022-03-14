import 'express-async-errors';
import express from 'express';
import compression from 'compression';
import lusca from 'lusca';
import path from 'path';
import axios from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import router from '@/controllers';
import db from '@/util/database';
import { requestLogger } from '@/util/logger';
import { corsHandler } from '@/util/cors';
import { errorOutput, notFoundHandler, errorLogger, errorNormalizer } from '@/middlewares';
import { PORT, VERSION, MONGODB_URI } from '@/config/secrets';

axiosBetterStacktrace(axios);

const app = express();

db.connect(MONGODB_URI);

app.set('trust proxy', true);
app.set('port', PORT);
app.use(corsHandler);
app.use(requestLogger);
app.use(compression());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(`/${VERSION}`, router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorNormalizer);
app.use(errorOutput);

export default app;
