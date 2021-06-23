import dotenv from 'dotenv';
import { NetworkProvider } from '../src/util/network';
import { deployPoolRegistry } from './lib/registry';

dotenv.config();

async function main() {
    console.log('[Test Network] Asset Pool Registry:', await deployPoolRegistry(NetworkProvider.Test));
    console.log('[Main Network] Asset Pool Registry:', await deployPoolRegistry(NetworkProvider.Main));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
