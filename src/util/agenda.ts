import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobProcessTransactions } from '@/jobs/transactionProcessor';

export const EVENT_REQUIRE_TRANSACTIONS = 'requireTransactions';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(EVENT_REQUIRE_TRANSACTIONS, jobProcessTransactions);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    agenda.every('5 seconds', EVENT_REQUIRE_TRANSACTIONS);

    logger.info('AgendaJS successfully started job processor');
});
