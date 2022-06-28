import Arweave from 'arweave';

const TEST_CONFIG = { host: '127.0.0.1', port: 1984, protocol: 'http' };
const PROD_CONFIG = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
};

const IS_TESTING = !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'development';

const arweave = Arweave.init(IS_TESTING ? TEST_CONFIG : PROD_CONFIG);

export default arweave;
