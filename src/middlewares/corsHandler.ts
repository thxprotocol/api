import cors from 'cors';
import { AUTH_URL, API_URL, WALLET_URL, DASHBOARD_URL, WIDGETS_URL } from '@/config/secrets';
import ClientProxy from '@/proxies/ClientProxy';

export const corsHandler = cors(async (req: any, callback: any) => {
    const origin = req.header('Origin');
    const allowedOrigins = [AUTH_URL, API_URL, WALLET_URL, DASHBOARD_URL, WIDGETS_URL];
    const isAllowedOrigin = req.auth?.client_id ? await ClientProxy.isAllowedOrigin(req.auth.client_id, origin) : false;

    if (!origin || allowedOrigins.includes(origin) || isAllowedOrigin) {
        callback(null, {
            credentials: true,
            origin: allowedOrigins,
        });
    } else {
        callback(new Error('Not allowed by CORS'));
    }
});
