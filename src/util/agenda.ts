import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { updatePendingTransactions } from '@/jobs/updatePendingTransactions';
import { generateRewardQRCodesJob } from '@/jobs/rewardQRcodesJob';
import { generateMetadataRewardQRCodesJob } from '@/jobs/metadataRewardQRcodesJob';
import { sendRemindersJob } from '@/jobs/remindersJob';
const agenda = new Agenda({
    name: 'jobs',
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

const EVENT_UPDATE_PENDING_TRANSACTIONS = 'updatePendingTransactions';
const EVENT_SEND_DOWNLOAD_QR_EMAIL = 'sendDownloadQrEmail';
const EVENT_REMINDER_SENT = 'sendRemindersJob';
const EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL = 'sendDownloadMetadataQrEmail';

agenda.define(EVENT_UPDATE_PENDING_TRANSACTIONS, updatePendingTransactions);
agenda.define(EVENT_SEND_DOWNLOAD_QR_EMAIL, generateRewardQRCodesJob);
agenda.define(EVENT_REMINDER_SENT, sendRemindersJob);
agenda.define(EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL, generateMetadataRewardQRCodesJob);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');

    await agenda.start();

    agenda.every('30 seconds', EVENT_UPDATE_PENDING_TRANSACTIONS);
    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_QR_EMAIL);
    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL);
    agenda.every('0 9 * * *', EVENT_REMINDER_SENT); // EVERY DAY AT 9AM

    logger.info('AgendaJS successfully started job processor');
});

export {
    agenda,
    EVENT_UPDATE_PENDING_TRANSACTIONS,
    EVENT_SEND_DOWNLOAD_QR_EMAIL,
    EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL,
};
