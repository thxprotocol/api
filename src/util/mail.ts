import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from './secrets';

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendMail = (to: string, subject: string, html: string) => {
    const options = {
        to,
        from: {
            email: 'peter@thx.network',
            name: 'Peter Polman',
        },
        subject,
        html,
    };
    return sgMail.send(options);
};
