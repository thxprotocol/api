import logger from './logger';
import dotenv from 'dotenv';

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;

switch (ENVIRONMENT) {
    case 'production':
        dotenv.config({ path: '.env.production' });
        break;
    case 'development':
        dotenv.config({ path: '.env.development' });
        break;
    case 'local':
        dotenv.config({ path: '.env.local' });
        break;
}

export const PRIVATE_KEY = process.env['PRIVATE_KEY'];
export const ADDRESS = process.env['ADDRESS'];

export const MONGODB_URI = process.env['MONGODB_URI'];
if (!MONGODB_URI) {
    logger.error('No mongo connection string. Set MONGODB_URI environment variable.');

    process.exit(1);
}
export const SESSION_SECRET = process.env['SESSION_SECRET'];
if (!SESSION_SECRET) {
    logger.error('No client secret. Set SESSION_SECRET environment variable.');
    process.exit(1);
}
