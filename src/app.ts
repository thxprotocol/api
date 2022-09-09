import 'express-async-errors';
import '@/config/openapi';

import axios from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import compression from 'compression';
import express from 'express';
import lusca from 'lusca';
import path from 'path';

import { MONGODB_URI, PORT, VERSION } from '@/config/secrets';
import router from '@/controllers';
import { corsHandler, errorLogger, errorNormalizer, errorOutput, notFoundHandler } from '@/middlewares';
import db from '@/util/database';
import { requestLogger } from '@/util/logger';

axiosBetterStacktrace(axios);

const app = express();

db.connect(MONGODB_URI);

app.set('trust proxy', true);
app.set('port', PORT);
app.use(requestLogger);
app.use(compression());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsHandler);
app.use(`/${VERSION}`, router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorNormalizer);
app.use(errorOutput);

export default app;
