import ERC20 from '../models/ERC20';
import { ERC721 } from '../models/ERC721';
import MailService from '../services/MailService';
import AccountProxy from '../proxies/AccountProxy';
import ejs from 'ejs';
import path from 'path';
import { DASHBOARD_URL, API_URL } from '../config/secrets';
import { AssetPool } from '../models/AssetPool';
import { Withdrawal } from '../models/Withdrawal';

export const sendRemindersJob = async () => {
    console.log('START REMINDER PROCESS');

    const accounts = await AccountProxy.getActiveAccountsEmail();

    const promises = accounts.map(async (account) => {
        const now = Date.now();
        const maxInactivityDays = 7;

        if ((now - new Date(account.createdAt).getTime()) / (24 * 60 * 60 * 1000) < maxInactivityDays) {
            console.log('ACCOUNT REGISTERED LESS THAN 7 DAYS AGO');
            return;
        }
        const subject = 'THX Reminder';
        let title: string, message: string;

        const numERC20s = await ERC20.count({ sub: account.id });
        const numERC721s = await ERC721.count({ sub: account.id });

        if (numERC20s + numERC721s == 0) {
            title = 'Account created but no Tokens or Collectibles';
            message = 'Email with tips on how to deploy assets';
            await sendEmail({ to: account.email, subject, title, message });
            console.log('SENT EMAIL TOKEN COLLECTIBLES');
            return;
        }

        const pools = await AssetPool.find({ sub: account.id });
        if (pools.length == 0) {
            title = 'Account and tokens / collectibles created but no pools to start using features';
            message = 'Email with tips on how to config pool';
            await sendEmail({ to: account.email, subject, title, message });
            console.log('SENT EMAIL POOLS');
            return;
        }

        const numWithdrawals = await Withdrawal.count({ sub: account.id });
        if (numWithdrawals == 0) {
            title = 'Pool created for tokens / collectibles but no withdrawals for that pool';
            message = 'Email with tips on how to config rewards etc';
            await sendEmail({ to: account.email, subject, title, message });
            console.log('SENT EMAIL WITHDRAWALS');
        }
    });
    await Promise.all(promises);
    console.log('END REMINDER PROCESS');
};

async function sendEmail(data: { to: string; subject: string; title: string; message: string }) {
    const html = await ejs.renderFile(
        path.dirname(__dirname) + '/templates/email/reminder.ejs',
        {
            title: data.title,
            message: data.message,
            baseUrl: API_URL,
            dashboardUrl: DASHBOARD_URL,
        },
        { async: true },
    );

    await MailService.send(data.to, data.subject, html);
}
//checkTokensAndCollectibles();
