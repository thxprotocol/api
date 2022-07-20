import dotenv from 'dotenv';

dotenv.config();

const required = [
    'ISSUER',
    'AUTH_URL',
    'API_URL',
    'WALLET_URL',
    'DASHBOARD_URL',
    'POLYGON_MUMBAI_RPC',
    'POLYGON_MUMBAI_NAME',
    'POLYGON_RPC',
    'POLYGON_NAME',
    'MONGODB_URI',
    'PRIVATE_KEY',
    'PORT',
    'AUTH_CLIENT_ID',
    'AUTH_CLIENT_SECRET',
    'RATE_LIMIT_REWARD_GIVE',
    'RATE_LIMIT_REWARD_GIVE_WINDOW',
    'INITIAL_ACCESS_TOKEN',
    'MAX_FEE_PER_GAS',
    'AWS_BUCKET_NAME',
    'AWS_BUCKET_REGION',
    'AWS_ACCESS_KEY',
    'AWS_SECRET_KEY',
    'AWS_ARN_KEY',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        console.log(`Set ${value} environment variable.`);
        process.exit(1);
    }
});

// This allows you to use a single .env file with both regular and test configuration. This allows for an
// easy to use setup locally without having hardcoded credentials during test runs.
if (process.env.NODE_ENV === 'test') {
    if (process.env.PORT_TEST_OVERRIDE !== undefined) process.env.PORT = process.env.PORT_TEST_OVERRIDE;
    if (process.env.MONGODB_URI_TEST_OVERRIDE !== undefined)
        process.env.MONGODB_URI = process.env.MONGODB_URI_TEST_OVERRIDE;
    if (process.env.HARDHAT_RPC_TEST_OVERRIDE) process.env.HARDHAT_RPC = process.env.HARDHAT_RPC_TEST_OVERRIDE;
}

export const VERSION = 'v1';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const ISSUER = process.env.ISSUER;
export const AUTH_URL = process.env.AUTH_URL;
export const API_URL = process.env.API_URL;
export const WALLET_URL = process.env.WALLET_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
export const WIDGETS_URL = process.env.WIDGETS_URL;
export const HARDHAT_RPC = process.env.HARDHAT_RPC;
export const HARDHAT_NAME = process.env.HARDHAT_NAME;
export const POLYGON_MUMBAI_RPC = process.env.POLYGON_MUMBAI_RPC;
export const POLYGON_MUMBAI_NAME = process.env.POLYGON_MUMBAI_NAME;
export const POLYGON_RPC = process.env.POLYGON_RPC;
export const POLYGON_NAME = process.env.POLYGON_NAME;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const PORT = process.env.PORT;
export const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
export const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;
export const RATE_LIMIT_REWARD_GIVE = Number(process.env.RATE_LIMIT_REWARD_GIVE);
export const RATE_LIMIT_REWARD_CLAIM = Number(process.env.RATE_LIMIT_REWARD_CLAIM);
export const RATE_LIMIT_REWARD_GIVE_WINDOW = Number(process.env.RATE_LIMIT_REWARD_GIVE_WINDOW);
export const RATE_LIMIT_REWARD_CLAIM_WINDOW = Number(process.env.RATE_LIMIT_REWARD_CLAIM_WINDOW);
export const INITIAL_ACCESS_TOKEN = process.env.INITIAL_ACCESS_TOKEN;
export const CIRCULATING_SUPPLY = process.env.CIRCULATING_SUPPLY;
export const MAX_FEE_PER_GAS = String(process.env.MAX_FEE_PER_GAS);
export const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
export const MINIMUM_GAS_LIMIT = 54680;
export const TESTNET_INFURA_GAS_TANK = process.env.TESTNET_INFURA_GAS_TANK;
export const INFURA_GAS_TANK = process.env.INFURA_GAS_TANK;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const AWS_ARN_KEY = process.env.AWS_ARN_KEY;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
export const AWS_S3_PRIVATE_BUCKET_NAME = process.env.AWS_S3_PRIVATE_BUCKET_NAME;
export const AWS_S3_PRIVATE_ACCESS_KEY = process.env.AWS_S3_PRIVATE_ACCESS_KEY;
export const AWS_S3_PRIVATE_SECRET_KEY = process.env.AWS_S3_PRIVATE_SECRET_KEY;
export const AWS_S3_PRIVATE_ARN_KEY = process.env.AWS_S3_PRIVATE_ARN_KEY;
export const AWS_S3_PRIVATE_BUCKET_REGION = process.env.AWS_S3_PRIVATE_BUCKET_REGION;
