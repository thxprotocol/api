import { NetworkProvider } from '../src/util/network';
import { deployFactory } from './lib/factory';

async function main() {
    console.log('Asset Pool Factory [Test]: ', await deployFactory(NetworkProvider.Test));
    console.log('Asset Pool Factory [Main]: ', await deployFactory(NetworkProvider.Main));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
