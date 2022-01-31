import express from 'express';
import compression from 'compression';
import lusca from 'lusca';
import path from 'path';
import router from './controllers';
import db from './util/database';
import { requestLogger } from './util/logger';
import { corsHandler } from './util/cors';
import { errorHandler, notFoundHandler } from './util/error';
import { PORT, VERSION, MONGODB_URI } from './util/secrets';
import { agenda, eventNameProcessWithdrawals } from './util/agenda';

const app = express();

(async function () {
    // Connect to the mongo db instance
    await db.connect(MONGODB_URI);

    // Start agenda job processing
    await agenda.start();

    // Create a processWithdrawals job if it does not exist in the db
    const jobs = await agenda.jobs({ name: eventNameProcessWithdrawals });

    if (!jobs.length) {
        await agenda.every('5 seconds', eventNameProcessWithdrawals);
    }
})();

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
app.use(errorHandler);

export default app;
