import dotenv from 'dotenv';
import logger from './logger';

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;

dotenv.config({ path: ENVIRONMENT === 'test' ? '.env.test' : '.env' });

const required = [
    'PORT',
    'ISSUER',
    'ASSET_POOL_FACTORY_ADDRESS',
    'SECURE_KEY',
    'ORIGIN',
    'RPC',
    'MONGODB_URI',
    'PRIVATE_KEY',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        console.log(value);
        logger.error(`Set ${value} environment variable.`);
        process.exit(1);
    }
});

export const PORT = process.env.PORT;
export const ISSUER = process.env.ISSUER;
export const ASSET_POOL_FACTORY_ADDRESS = process.env.ASSET_POOL_FACTORY_ADDRESS;
export const ORIGIN = process.env.ORIGIN;
export const RPC = process.env.RPC;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const SECURE_KEY = process.env.SECURE_KEY;
export const SENDGRID_USER = process.env.SENDGRID_USER;
export const SENDGRID_PASSWORD = process.env.SENDGRID_PASSWORD;
