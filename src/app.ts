import express from 'express';
import compression from 'compression';
import lusca from 'lusca';
import path from 'path';
import router from './controllers';
import { oidc, router as oidcRouter } from './oidc';
import db from './util/database';
import { requestLogger } from './util/logger';
import { corsHandler } from './util/cors';
import { errorHandler, notFoundHandler } from './util/error';
import { PORT, VERSION, MONGODB_URI, DASHBOARD_URL, PUBLIC_URL } from './util/secrets';

import { BullQueueProvider } from './controllers/queue/implementations/BullQueueProvider';
import { IQueueProvider } from './controllers/queue/IQueueProvider';
import { Worker } from 'bullmq';
import DataProcessor from './controllers/queue/workers/data.processor';
import { router as bullRouter } from 'bull-board';

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
app.use(
    '/',
    (req, res, next) => {
        res.locals = {
            dashboardUrl: DASHBOARD_URL,
            publicUrl: PUBLIC_URL,
        };
        next();
    },
    oidcRouter,
);
app.use(`/${VERSION}`, express.json());
app.use(`/${VERSION}`, express.urlencoded({ extended: true }));
app.use(`/${VERSION}`, router);
app.use('/', oidc.callback);
app.use(notFoundHandler);
app.use(errorHandler);

class App {
    public queueProvider: IQueueProvider;
    constructor() {
        this.queueProvider = new BullQueueProvider();
        this.initialization();
    }

    private initialization(): void {
        this.middlewares();
        this.workers();
        this.queues();
    }

    private middlewares(): void {
        app.use('/admin/queues', bullRouter);
    }

    private queues(): void {
        this.queueProvider.register({ queueName: 'data-processor' });
        this.queueProvider.setUI();
    }

    private workers(): void {
        new Worker('data-processor', DataProcessor);
    }
}

const queue = new App();
const { queueProvider } = queue;

export default { app, queueProvider };
