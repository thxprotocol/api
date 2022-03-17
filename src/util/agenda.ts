import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobProcessTransactions } from '@/jobs/requireTransactions';

export const eventNameRequireTransactions = 'requireTransactions';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameRequireTransactions, jobProcessTransactions);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    agenda.every('5 seconds', eventNameRequireTransactions);

    logger.info('Started agenda processing');
});
