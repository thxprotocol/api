import cors from 'cors';
import { AUTH_URL, API_URL, WALLET_URL, DASHBOARD_URL, WIDGETS_URL } from '../util/secrets';

export const corsHandler = cors(async (req: any, callback: Function) => {
    const origin = req.header('Origin');
    const allowedOrigins = [AUTH_URL, API_URL, WALLET_URL, DASHBOARD_URL, WIDGETS_URL];

    // TODO Check for redirectUris here
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, {
            credentials: true,
            origin: allowedOrigins,
        });
    } else {
        callback(new Error('Not allowed by CORS'));
    }
});
