import { Agenda } from 'agenda';
import { logger } from './logger';
import db from './database';

import { jobProcessWithdrawals } from '@/jobs/processWithdrawals';
import { jobRequireDeposits } from '@/jobs/requireTransfer';

export const eventNameProcessWithdrawals = 'processWithdrawals';
export const eventNameRequireDeposits = 'requireDeposits';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameProcessWithdrawals, jobProcessWithdrawals);
agenda.define(eventNameRequireDeposits, jobRequireDeposits);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs', function (err) {
        logger.error(err);
    });
    await agenda.start();
    agenda.every('5 seconds', eventNameProcessWithdrawals);
    agenda.every('10 seconds', eventNameRequireDeposits);
});
