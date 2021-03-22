import dotenv from 'dotenv';
import { ethers } from 'ethers/lib';
import { deployAssetPoolFactory, deployPoolRegistry } from '../src/util/factory';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

const provider = new ethers.providers.WebSocketProvider(process.env.PUBLIC_RPC);
const admin = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
    console.log('Asset Pool Factory:', await deployAssetPoolFactory(admin));
    console.log('Asset Pool Registry:', await deployPoolRegistry(admin));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
