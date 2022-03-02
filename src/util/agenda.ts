import { Agenda } from 'agenda';
import { logger } from './logger';
import db from './database';

import { jobProcessWithdrawals } from '@/jobs/processWithdrawals';
import { jobRequireDeposits } from '@/jobs/requireDeposit';
// import { jobRequireWithdraws } from '@/jobs/requireWithdraw';

export const eventNameProcessWithdrawals = 'processWithdrawals';
export const eventNameRequireDeposits = 'requireDeposits';
export const eventNameRequireWithdraws = 'requireWithdraws';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameProcessWithdrawals, jobProcessWithdrawals);
agenda.define(eventNameRequireDeposits, jobRequireDeposits);
// agenda.define(eventNameRequireWithdraws, jobRequireWithdraws);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    agenda.every('5 seconds', eventNameProcessWithdrawals);
    agenda.every('5 seconds', eventNameRequireDeposits);
    // agenda.every('5 seconds', eventNameRequireWithdraws);

    logger.info('Started agenda processing');
});
