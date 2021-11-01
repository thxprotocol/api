import ejs from 'ejs';
import { sendMail } from '../util/mail';
import { createRandomToken } from '../util/tokens';
import path from 'path';
import { API_URL, WALLET_URL, SECURE_KEY } from '../util/secrets';
import { encryptString } from '../util/encrypt';
import AccountService from './AccountService';

const DURATION_TEN_MINUTES = Date.now() + 10 * 60 * 1000;

export default class MailService {
    static async sendLoginLinkEmail(email: string, password: string) {
        try {
            const secureKey = encryptString(password, SECURE_KEY.split(',')[0]);
            const authenticationToken = encryptString(createRandomToken(), password);
            const html = await ejs.renderFile(
                path.dirname(__dirname) + '/views/mail/loginLink.ejs',
                {
                    authenticationToken,
                    secureKey,
                    returnUrl: WALLET_URL,
                    baseUrl: API_URL,
                },
                { async: true },
            );
            const { account, error } = await AccountService.getByEmail(email);

            if (error) throw new Error(error);

            await sendMail(email, 'A sign in is requested for your Web Wallet', html);

            await AccountService.update(account.sub, {
                authenticationToken,
                authenticationTokenExpires: DURATION_TEN_MINUTES,
            });

            return { result: true };
        } catch (error) {
            return { error };
        }
    }
}
