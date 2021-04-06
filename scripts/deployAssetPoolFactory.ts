import dotenv from 'dotenv';
import { ethers } from 'ethers/lib';
import { deployAssetPoolFactory, deployPoolRegistry } from '../src/util/factory';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

async function main() {
    const provider = new ethers.providers.WebSocketProvider(process.env.RPC);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('Asset Pool Factory:', await deployAssetPoolFactory(signer));
    console.log('Asset Pool Registry:', await deployPoolRegistry(signer));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
