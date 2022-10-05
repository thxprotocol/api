import { TransactionalEmail } from '@/models/TransactionalEmail';
import { EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS, MAX_REMINDERS } from '@/util/agenda';
import ERC20 from '../../models/ERC20';
import { ERC721 } from '../../models/ERC721';
import AccountProxy from '../../proxies/AccountProxy';
import { logger } from '../../util/logger';
import { sendEmail } from './utils';

export const reminderJobAccountCreatedNoTokens = async () => {
    const reminderType = EVENT_SEND_REMINDER_ACCOUNT_CREATED_NO_TOKENS;
    try {
        logger.info(`START REMINDER JOB - ${reminderType}`);

        // Account created but no Tokens or Collectibles
        const accounts = await AccountProxy.getActiveAccountsEmail();
        const promises = accounts.map(async (account) => {
            const now = Date.now();
            const maxInactivityDays = 7;

            if ((now - new Date(account.createdAt).getTime()) / (24 * 60 * 60 * 1000) < maxInactivityDays) {
                logger.info('ACCOUNT REGISTERED LESS THAN 7 DAYS AGO');
                return;
            }

            const numERC20s = await ERC20.count({ sub: account.id });
            const numERC721s = await ERC721.count({ sub: account.id });

            if (numERC20s + numERC721s == 0) {
                const numEmailSent = await TransactionalEmail.count({ sub: account.id, type: reminderType });

                if (numEmailSent >= MAX_REMINDERS) {
                    logger.info('MAXIMUM NUMBER OF EMAILS REACHED.');
                    return;
                }

                const subject = 'THX Reminder';
                const title = 'Account created but no Tokens or Collectibles';
                const message = 'Email with tips on how to deploy assets';

                await sendEmail({ to: account.email, subject, title, message });

                await TransactionalEmail.create({
                    sub: account.id,
                    type: reminderType,
                });
                logger.info('EMAIL SENT');
            }
        });
        if (promises.length) {
            await Promise.all(promises);
        } else {
            logger.info('NO ACCOUNTS TO PROCESS.');
        }

        logger.info('END REMINDER JOB');
    } catch (err) {
        logger.error(`ERROR on Reminders Job - ${reminderType}`, err);
    }
};
