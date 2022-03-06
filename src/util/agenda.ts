import { Agenda } from 'agenda';
import { logger } from './logger';
import db from './database';

import { jobRequireDeposits } from '@/jobs/requireDeposit';
import { jobRequireTransactions } from '@/jobs/requireTransactions';

export const eventNameRequireDeposits = 'requireDeposits';
export const eventNameRequireTransactions = 'requireTransactions';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameRequireDeposits, jobRequireDeposits);
agenda.define(eventNameRequireTransactions, jobRequireTransactions);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    agenda.every('5 seconds', eventNameRequireDeposits);
    agenda.every('5 seconds', eventNameRequireTransactions);

    logger.info('Started agenda processing');
});
