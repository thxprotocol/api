import ERC20 from '../../models/ERC20';
import { ERC721 } from '../../models/ERC721';
import AccountProxy from '../../proxies/AccountProxy';
import { AssetPool } from '../../models/AssetPool';
import { logger } from '../../util/logger';
import { sendEmail } from './utils';
import { TransactionalEmail } from '@/models/TransactionalEmail';
import { EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS, MAX_REMINDERS } from '@/util/agenda';

export const reminderJobTokensCreatedNoPools = async () => {
    const reminderType = EVENT_SEND_REMINDER_TOKENS_CREATED_NO_POOLS;
    try {
        logger.info(`START REMINDER JOB - ${reminderType}`);

        // Account and tokens / collectibles created but no pools
        const accounts = await AccountProxy.getActiveAccountsEmail();
        const promises = accounts.map(async (account) => {
            const numERC20s = await ERC20.count({ sub: account.id });
            const numERC721s = await ERC721.count({ sub: account.id });

            if (numERC20s + numERC721s == 0) {
                return;
            }

            const pools = await AssetPool.find({ sub: account.id });

            if (pools.length == 0) {
                const numEmailSent = await TransactionalEmail.count({ sub: account.id, type: reminderType });

                if (numEmailSent >= MAX_REMINDERS) {
                    logger.info('MAXIMUM NUMBER OF EMAILS REACHED.');
                    return;
                }

                const subject = 'THX Reminder';
                const title = 'Account and tokens / collectibles created but no pools to start using features';
                const message = 'Email with tips on how to config pool';

                await sendEmail({ to: account.email, subject, title, message });
                await TransactionalEmail.create({ sub: account.id, type: reminderType });
                logger.info('EMAIL SENT');
            }
        });
        if (promises.length) {
            await Promise.all(promises);
        } else {
            logger.info('NO ACCOUNTS TO PROCESS.');
        }
    } catch (err) {
        logger.error(`ERROR on Reminders Job - ${reminderType}`, err);
    }
};
