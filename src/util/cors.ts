import cors from 'cors';
import { ISSUER } from './secrets';

export const corsHandler = cors({
    credentials: true,
    origin: (origin: string, callback: Function) => {
        // TODO Create this array of origins based on registered client records
        // only affects clients that call the API from a browser
        const allowedOrigins = [ISSUER, origin];

        if (!origin || allowedOrigins.indexOf(origin) > -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
});
