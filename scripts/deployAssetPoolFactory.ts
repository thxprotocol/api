import dotenv from 'dotenv';
import { ethers } from 'ethers/lib';
import { deployAssetPoolFactory, deployPoolRegistry } from '../src/util/factory';

dotenv.config();

async function main() {
    const testnetProvider = new ethers.providers.WebSocketProvider(process.env.TESTNET_RPC_WSS);
    const testnetSigner = new ethers.Wallet(process.env.PRIVATE_KEY, testnetProvider);

    const provider = new ethers.providers.WebSocketProvider(process.env.RPC_WSS);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('[Test Network] Asset Pool Factory:', await deployAssetPoolFactory(testnetSigner));
    console.log('[Test Network] Asset Pool Registry:', await deployPoolRegistry(testnetSigner));

    console.log('[Main Network] Asset Pool Factory:', await deployAssetPoolFactory(signer));
    console.log('[Main Network] Asset Pool Registry:', await deployPoolRegistry(signer));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
