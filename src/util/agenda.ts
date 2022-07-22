import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobProcessTransactions } from '@/jobs/transactionProcessor';
import { generateRewardQRCodesJob } from '@/jobs/rewardQRcodesJob';

const agenda = new Agenda({
    name: 'jobs',
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

const EVENT_REQUIRE_TRANSACTIONS = 'requireTransactions';
const EVENT_SEND_KPI = 'sendKPI';
const EVENT_SEND_DOWNLOAD_QR_EMAIL = 'sendDownloadQrEmail';

agenda.define(EVENT_REQUIRE_TRANSACTIONS, jobProcessTransactions);
agenda.define(EVENT_SEND_DOWNLOAD_QR_EMAIL, generateRewardQRCodesJob);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');

    await agenda.start();

    agenda.every('5 seconds', EVENT_REQUIRE_TRANSACTIONS);

    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_QR_EMAIL);

    logger.info('AgendaJS successfully started job processor');
});

export { agenda, EVENT_REQUIRE_TRANSACTIONS, EVENT_SEND_KPI, EVENT_SEND_DOWNLOAD_QR_EMAIL };
