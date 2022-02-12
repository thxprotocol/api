import { deployRegistry } from './lib/registry';
import { NetworkProvider } from '../../src/util/network';

async function main() {
    // console.log('Asset Pool Registry [Test]:', await deployRegistry(NetworkProvider.Test));
    console.log('Asset Pool Registry [Main]:', await deployRegistry(NetworkProvider.Main));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
