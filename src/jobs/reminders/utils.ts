import MailService from '../../services/MailService';
import ejs from 'ejs';
import { API_URL, DASHBOARD_URL } from '@/config/secrets';

export async function sendEmail(data: { to: string; subject: string; title: string; message: string }) {
    const html = await ejs.renderFile(
        './src/templates/email/reminder.ejs',
        {
            title: data.title,
            message: data.message,
            baseUrl: API_URL,
            dashboardUrl: DASHBOARD_URL,
        },
        { async: true },
    );

    return await MailService.send(data.to, data.subject, html);
}
