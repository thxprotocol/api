import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobProcessTransactions } from '@/jobs/transactionProcessor';
import { jobSendKPI } from '@/jobs/sendKPI';

const agenda = new Agenda({
    name: 'jobs',
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

const agendaAsync = new Agenda({
    name: 'jobsasync',
});

const EVENT_REQUIRE_TRANSACTIONS = 'requireTransactions';
const EVENT_SEND_KPI = 'sendKPI';

agenda.define(EVENT_REQUIRE_TRANSACTIONS, jobProcessTransactions);
agendaAsync.define(EVENT_SEND_KPI, jobSendKPI);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    agendaAsync.mongo(db.connection.getClient().db(), 'jobsasync');

    await agenda.start();
    await agendaAsync.start();

    agenda.every('5 seconds', EVENT_REQUIRE_TRANSACTIONS);
    agendaAsync.every('1 month', EVENT_SEND_KPI, {}, { startDate: new Date('2022-07-01') });

    logger.info('AgendaJS successfully started job processor');
});

export { agenda, agendaAsync, EVENT_REQUIRE_TRANSACTIONS, EVENT_SEND_KPI };
