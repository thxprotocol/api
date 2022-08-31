import Arweave from 'arweave';

const CONFIG = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
};

export const ARWEAVE_URL = CONFIG.protocol + '://' + CONFIG.host + (CONFIG.port !== 443 ? `:${CONFIG.port}` : '');

const arweave = Arweave.init(CONFIG);

export const getArweaveKey = async () => {
    const key = JSON.parse(process.env.ARWEAVE_KEY);
    const address = await arweave.wallets.jwkToAddress(key);
    const balance = await arweave.wallets.getBalance(address);
    const ar = arweave.ar.winstonToAr(balance);
    console.log('arweave wallet balance', balance);
    return key;
};

export default arweave;
