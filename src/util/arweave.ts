import Arweave from 'arweave';
import TestWeave from 'testweave-sdk';

export let TEST_WAVE: TestWeave | null = null;

const TEST_CONFIG = {
    host: '127.0.0.1',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: false,
};

const PROD_CONFIG = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
};

export const IS_TESTING = !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'development';

const arweave = Arweave.init(IS_TESTING ? TEST_CONFIG : PROD_CONFIG);

export const getArweaveKey = async () => {
    if (IS_TESTING) {
        if (!TEST_WAVE) TEST_WAVE = await TestWeave.init(arweave);
        return TEST_WAVE.rootJWK;
    }

    if (!process.env.ARWEAVE_KEY) {
        throw Error('Please set-up Arweave JSON key in ARWEAVE_KEY environment variable');
    }

    return JSON.parse(process.env.ARWEAVE_KEY);
};

export default arweave;
