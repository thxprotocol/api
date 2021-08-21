import ejs from 'ejs';
import { AccountDocument } from '../models/Account';
import { sendMail } from '../util/mail';
import { createRandomToken } from '../util/tokens';
import path from 'path';
import { ISSUER } from '../util/secrets';

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
}
