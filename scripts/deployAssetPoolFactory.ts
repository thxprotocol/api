import dotenv from 'dotenv';
import { NetworkProvider } from '../src/util/network';
import { deployAssetPoolFactory } from './lib/factory';

dotenv.config();

async function main() {
    console.log('[Test Network] Asset Pool Factory:', await deployAssetPoolFactory(NetworkProvider.Test));
    console.log('[Main Network] Asset Pool Factory:', await deployAssetPoolFactory(NetworkProvider.Main));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
