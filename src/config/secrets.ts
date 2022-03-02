import dotenv from 'dotenv';

dotenv.config();

const required = [
    'ISSUER',
    'SECURE_KEY',
    'AUTH_URL',
    'API_URL',
    'WALLET_URL',
    'DASHBOARD_URL',
    'RPC',
    'TESTNET_RPC',
    'MONGODB_URI',
    'PRIVATE_KEY',
    'PORT',
    'AUTH_CLIENT_ID',
    'AUTH_CLIENT_SECRET',
    'SENDGRID_API_KEY',
    'RATE_LIMIT_REWARD_GIVE',
    'RATE_LIMIT_REWARD_GIVE_WINDOW',
    'INITIAL_ACCESS_TOKEN',
    'MAX_FEE_PER_GAS',
    'NETWORK_ENVIRONMENT',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        console.log(`Set ${value} environment variable.`);
        process.exit(1);
    }
});

if (!['local', 'prod', 'dev'].includes(process.env.NETWORK_ENVIRONMENT)) {
    console.log('NETWORK_ENVIRONMENT environment variable needs to be set to local | dev | prod.');
    process.exit(1);
}

// This allows you to use a single .env file with both regular and test configuration. This allows for an
// easy to use setup locally without having hardcoded credentials during test runs.
if (process.env.NODE_ENV === 'test') {
    if (process.env.PORT_TEST_OVERRIDE !== undefined) process.env.PORT = process.env.PORT_TEST_OVERRIDE;
    if (process.env.MONGODB_URI_TEST_OVERRIDE !== undefined)
        process.env.MONGODB_URI = process.env.MONGODB_URI_TEST_OVERRIDE;
    if (process.env.RPC_TEST_OVERRIDE !== undefined) process.env.RPC = process.env.RPC_TEST_OVERRIDE;
}

export const VERSION = 'v1';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const ISSUER = process.env.ISSUER;
export const SECURE_KEY = process.env.SECURE_KEY;
export const AUTH_URL = process.env.AUTH_URL;
export const API_URL = process.env.API_URL;
export const WALLET_URL = process.env.WALLET_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
export const WIDGETS_URL = process.env.WIDGETS_URL;
export const RPC = process.env.RPC;
export const TESTNET_RPC = process.env.TESTNET_RPC;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const COLLECTOR = process.env.COLLECTOR;
export const PORT = process.env.PORT;
export const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
export const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const RATE_LIMIT_REWARD_GIVE = Number(process.env.RATE_LIMIT_REWARD_GIVE);
export const RATE_LIMIT_REWARD_CLAIM = Number(process.env.RATE_LIMIT_REWARD_CLAIM);
export const RATE_LIMIT_REWARD_GIVE_WINDOW = Number(process.env.RATE_LIMIT_REWARD_GIVE_WINDOW);
export const RATE_LIMIT_REWARD_CLAIM_WINDOW = Number(process.env.RATE_LIMIT_REWARD_CLAIM_WINDOW);
export const INITIAL_ACCESS_TOKEN = process.env.INITIAL_ACCESS_TOKEN;
export const CIRCULATING_SUPPLY = process.env.CIRCULATING_SUPPLY;
export const MAX_FEE_PER_GAS = String(process.env.MAX_FEE_PER_GAS);
export const NETWORK_ENVIRONMENT = process.env.NETWORK_ENVIRONMENT as 'local' | 'dev' | 'prod';
export const MINIMUM_GAS_LIMIT = 54680;
