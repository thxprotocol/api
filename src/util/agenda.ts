import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { updatePendingTransactions } from '@/jobs/updatePendingTransactions';
// import { checkReceipts } from '@/jobs/checkReceipts';
import { generateRewardQRCodesJob } from '@/jobs/rewardQRcodesJob';

const agenda = new Agenda({
    name: 'jobs',
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 seconds',
});

const EVENT_UPDATE_PENDING_TRANSACTIONS = 'updatePendingTransactions';
// const EVENT_UPDATE_PENDING_TRANSACTIONS_RECEIPTS = 'updatePendingTransactionReceipts';
const EVENT_SEND_DOWNLOAD_QR_EMAIL = 'sendDownloadQrEmail';

agenda.define(EVENT_UPDATE_PENDING_TRANSACTIONS, updatePendingTransactions);
// agenda.define(EVENT_UPDATE_PENDING_TRANSACTIONS_RECEIPTS, checkReceipts);
agenda.define(EVENT_SEND_DOWNLOAD_QR_EMAIL, generateRewardQRCodesJob);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');

    await agenda.start();

    agenda.every('30 seconds', EVENT_UPDATE_PENDING_TRANSACTIONS);
    // agenda.every('1 seconds', EVENT_UPDATE_PENDING_TRANSACTIONS_BC);
    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_QR_EMAIL);

    logger.info('AgendaJS successfully started job processor');
});

export { agenda, EVENT_UPDATE_PENDING_TRANSACTIONS, EVENT_SEND_DOWNLOAD_QR_EMAIL };
