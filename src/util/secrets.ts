import logger from './logger';
import dotenv from 'dotenv';
import fs from 'fs';

export const VERSION = 'v1';
export const REWARD_POOL_ABI = fs.readFileSync('./src/contracts/RewardPool.abi', 'utf8');
export const REWARD_POOL_BIN = fs.readFileSync('./src/contracts/RewardPool.bin', 'utf8');
export const ERC20_ABI = fs.readFileSync('./src/contracts/ERC20.abi', 'utf8');
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
export const EXTDEV_CHAIN_ID = process.env['EXTDEV_CHAIN_ID'];
export const EXTDEV_SOCKET_URL = process.env['EXTDEV_SOCKET_URL'];
export const EXTDEV_QUERY_URL = process.env['EXTDEV_QUERY_URL'];

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
