import dotenv from 'dotenv';
import { logger } from './logger';

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;

dotenv.config({ path: ENVIRONMENT === 'test' ? '.env.example' : '.env' });

const required = [
    'ISSUER',
    'WALLET_URL',
    'PUBLIC_URL',
    'DASHBOARD_URL',

    'RPC',
    'RPC_WSS',
    'ASSET_POOL_FACTORY_ADDRESS',
    'POOL_REGISTRY_ADDRESS',

    'TESTNET_RPC',
    'TESTNET_RPC_WSS',
    'TESTNET_ASSET_POOL_FACTORY_ADDRESS',
    'TESTNET_POOL_REGISTRY_ADDRESS',

    'MONGODB_URI',
    'PRIVATE_KEY',
    'COLLECTOR',
    'PORT',
    'GTM',
    'SECURE_KEY',
    'SENDGRID_API_KEY',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        const message = `Set ${value} environment variable.`;
        logger.error(message);
        process.exit(1);
    }
});

export const ISSUER = process.env.ISSUER;
export const WALLET_URL = process.env.WALLET_URL;
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;

export const RPC = process.env.RPC;
export const RPC_WSS = process.env.RPC_WSS;
export const POOL_REGISTRY_ADDRESS = process.env.POOL_REGISTRY_ADDRESS;
export const ASSET_POOL_FACTORY_ADDRESS = process.env.ASSET_POOL_FACTORY_ADDRESS;

export const TESTNET_RPC = process.env.TESTNET_RPC;
export const TESTNET_RPC_WSS = process.env.TESTNET_RPC_WSS;
export const TESTNET_POOL_REGISTRY_ADDRESS = process.env.TESTNET_POOL_REGISTRY_ADDRESS;
export const TESTNET_ASSET_POOL_FACTORY_ADDRESS = process.env.TESTNET_ASSET_POOL_FACTORY_ADDRESS;

export const MONGODB_URI = process.env.MONGODB_URI;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const COLLECTOR = process.env.COLLECTOR;
export const PORT = process.env.PORT;
export const SECURE_KEY = process.env.SECURE_KEY;
export const GTM = process.env.GTM;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
