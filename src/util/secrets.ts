import dotenv from 'dotenv';
import { logger } from './logger';

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;

dotenv.config({ path: ENVIRONMENT === 'test' ? '.env.example' : '.env' });

const required = [
    'PORT',
    'ISSUER',
    'ASSET_POOL_FACTORY_ADDRESS',
    'SECURE_KEY',
    'WALLET_URL',
    'DASHBOARD_URL',
    'RPC',
    'WSS_RPC',
    'MONGODB_URI',
    'PRIVATE_KEY',
    'COLLECTOR',
    'POOL_REGISTRY_ADDRESS',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        const message = `Set ${value} environment variable.`;
        logger.error(message);
        process.exit(1);
    }
});

export const PORT = process.env.PORT;

export const ISSUER = process.env.ISSUER;
export const WALLET_URL = process.env.WALLET_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;

export const MONGODB_URI = process.env.MONGODB_URI;

export const SECURE_KEY = process.env.SECURE_KEY;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const PRIVATE_KEY = process.env.PRIVATE_KEY;

export const RPC = process.env.RPC;
export const WSS_RPC = process.env.WSS_RPC;
export const COLLECTOR = process.env.COLLECTOR;
export const POOL_REGISTRY_ADDRESS = process.env.POOL_REGISTRY_ADDRESS;
export const ASSET_POOL_FACTORY_ADDRESS = process.env.ASSET_POOL_FACTORY_ADDRESS;
