import ejs from 'ejs';
import { AccountDocument } from '../models/Account';
import { sendMail } from '../util/mail';
import { createRandomToken } from '../util/tokens';
import path from 'path';
import { ISSUER, SECURE_KEY, WALLET_URL } from '../util/secrets';
import { encryptString } from '../util/encrypt';

export default class MailService {
    static async sendConfirmationEmail(account: AccountDocument, returnUrl: string) {
        try {
            account.signupToken = createRandomToken();
            account.signupTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours,

            const html = await ejs.renderFile(
                path.dirname(__dirname) + '/views/mail/signupConfirm.ejs',
                {
                    signupToken: account.signupToken,
                    returnUrl,
                    baseUrl: ISSUER,
                },
                { async: true },
            );

            await sendMail(account.email, 'Please complete the sign up for your THX Account', html);

            await account.save();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async sendLoginLinkEmail(account: AccountDocument, password: string) {
        try {
            const secureKey = encryptString(password, SECURE_KEY.split(',')[0]);
            const authToken = createRandomToken();
            const encryptedAuthToken = encryptString(authToken, password);
            const html = await ejs.renderFile(
                path.dirname(__dirname) + '/views/mail/loginLink.ejs',
                {
                    authenticationToken: encryptedAuthToken,
                    secureKey,
                    returnUrl: WALLET_URL,
                    baseUrl: ISSUER,
                },
                { async: true },
            );

            await sendMail(account.email, 'A sign in is requested for your Web Wallet', html);

            account.authenticationToken = encryptedAuthToken;
            account.authenticationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            await account.save();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async sendResetPasswordEmail(account: AccountDocument, returnUrl: string, uid: string) {
        try {
            account.passwordResetToken = createRandomToken();
            account.passwordResetExpires = Date.now() + 1000 * 60 * 20; // 20 minutes,
            const html = await ejs.renderFile(
                path.dirname(__dirname) + '/views/mail/resetPassword.ejs',
                {
                    passwordResetToken: account.passwordResetToken,
                    uid,
                    returnUrl,
                    baseUrl: ISSUER,
                },
                { async: true },
            );

            await sendMail(account.email, 'Reset your THX Password', html);

            await account.save();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }
}
