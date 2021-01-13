import dotenv from 'dotenv';
import logger from './logger';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;
export const MONGODB_URI = process.env['MONGODB_URI'];
export const PRIVATE_KEY = process.env['PRIVATE_KEY'];
export const ASSET_POOL_FACTORY_ADDRESS = process.env['ASSET_POOL_FACTORY_ADDRESS'];
export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const ORIGIN = process.env['ORIGIN'];
export const RPC = process.env['RPC'];

if (!MONGODB_URI) {
    logger.error('No mongo connection string. Set MONGODB_URI environment variable.');
    process.exit(1);
}
