import AccountProxy from '../../proxies/AccountProxy';
import { AssetPool } from '../../models/AssetPool';
import { Withdrawal } from '../../models/Withdrawal';
import { logger } from '../../util/logger';
import { sendEmail } from './utils';
import { TransactionalEmail } from '@/models/TransactionalEmail';
import { EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS, MAX_REMINDERS } from '@/util/agenda';

export const reminderJobPoolsCreatedNoWithdrawals = async () => {
    const reminderType = EVENT_SEND_REMINDER_POOLS_CREATED_NO_WITHDRAWALS;
    try {
        logger.info(`START REMINDER JOB - ${reminderType}`);

        // Pool created for tokens / collectibles but no withdrawals
        const pools = await AssetPool.find();

        const promises = pools.map(async (pool) => {
            const numWithdrawals = await Withdrawal.count({ poolId: pool._id });
            if (numWithdrawals > 0) {
                return;
            }
            const account = await AccountProxy.getById(pool.sub);
            if (!account) {
                logger.error('POOL ACCOUNT NOT FOUND', { poolId: pool._id });
                return;
            }
            if (!account.active) {
                logger.info('POOL ACCOUNT NOT ACTIVE');
                return;
            }
            if (!account.email) {
                logger.error('ACCOUNT EMAIL NOT SET', { accountId: account._id });
                return;
            }

            const numEmailSent = await TransactionalEmail.count({ sub: account.id, type: reminderType });

            if (numEmailSent >= MAX_REMINDERS) {
                logger.info('MAXIMUM NUMBER OF EMAILS REACHED.');
                return;
            }

            const subject = 'THX Reminder';
            const title = 'Pool created for tokens / collectibles but no withdrawals for that pool';
            const message = 'Email with tips on how to config rewards etc';

            await sendEmail({ to: account.email, subject, title, message });
            await TransactionalEmail.create({ sub: account.id, type: reminderType });
            logger.info('EMAIL SENT');
        });

        if (promises.length) {
            await Promise.all(promises);
        } else {
            logger.info('NO POOLS TO PROCESS.');
        }
        logger.info('END REMINDER JOB');
    } catch (err) {
        logger.error(`ERROR on Reminders Job - ${reminderType}`, err);
    }
};
