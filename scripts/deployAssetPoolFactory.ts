import dotenv from 'dotenv';
import { ethers } from 'ethers/lib';
import { deployAssetPoolFactory } from '../test/e2e/lib/contracts';
import IAssetPoolFactory from '../src/artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

const provider = new ethers.providers.WebSocketProvider(process.env.PUBLIC_RPC);
const admin = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
    const address = await deployAssetPoolFactory();
    const factory = new ethers.Contract(address, IAssetPoolFactory.abi, admin);

    console.log('AssetPoolFactory:', factory.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
