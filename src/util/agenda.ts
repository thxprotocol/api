import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { updatePendingTransactions } from '@/jobs/updatePendingTransactions';
import { generateRewardQRCodesJob } from '@/jobs/rewardQRcodesJob';
import { generateMetadataRewardQRCodesJob } from '@/jobs/metadataRewardQRcodesJob';
import { reminderJobAccountCreatedNoTokens } from '@/jobs/reminders/01_accountCreatedNoTokens';
import { reminderJobTokensCreatedNoPools } from '@/jobs/reminders/02_tokensCreatedNoPools';
import { reminderJobPoolsCreatedNoWithdrawals } from '@/jobs/reminders/03_poolsCreatedNoWithdrawals';
const agenda = new Agenda({
    name: 'jobs',
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

const EVENT_UPDATE_PENDING_TRANSACTIONS = 'updatePendingTransactions';
const EVENT_SEND_DOWNLOAD_QR_EMAIL = 'sendDownloadQrEmail';
const EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL = 'sendDownloadMetadataQrEmail';

const EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS = 'reminder-job-account-created-no-tokens';
const EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS = 'reminder-job-tokens-created-no-pools';
const EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS = 'reminder-job-pools-created-no-withdrawals';
const MAX_REMINDERS = 3;

agenda.define(EVENT_UPDATE_PENDING_TRANSACTIONS, updatePendingTransactions);
agenda.define(EVENT_SEND_DOWNLOAD_QR_EMAIL, generateRewardQRCodesJob);
agenda.define(EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL, generateMetadataRewardQRCodesJob);

agenda.define(EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS, reminderJobAccountCreatedNoTokens);
agenda.define(EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS, reminderJobTokensCreatedNoPools);
agenda.define(EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS, reminderJobPoolsCreatedNoWithdrawals);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');

    await agenda.start();

    agenda.every('30 seconds', EVENT_UPDATE_PENDING_TRANSACTIONS);
    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_QR_EMAIL);
    agenda.every('5 seconds', EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL);
    agenda.every('0 9 * * *', EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS); // EVERY DAY AT 9 AM
    agenda.every('5 9 * * *', EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS); // EVERY DAY AT 9.05 AM
    agenda.every('10 9 * * *', EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS); // EVERY DAY AT 9.10 AM

    logger.info('AgendaJS successfully started job processor');
});

export {
    agenda,
    EVENT_UPDATE_PENDING_TRANSACTIONS,
    EVENT_SEND_DOWNLOAD_QR_EMAIL,
    EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL,
    EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS,
    EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS,
    EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS,
    MAX_REMINDERS,
};
