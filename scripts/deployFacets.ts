import dotenv from 'dotenv';
import { NetworkProvider } from '../src/util/network';
import { deployFacets } from './lib/facets';

dotenv.config();

async function main() {
    console.log('Facets [Test]:', await deployFacets(NetworkProvider.Test));
    console.log('Facets [Main]:', await deployFacets(NetworkProvider.Main));
    console.log('*** UPDATE YOUR .ENV ***');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
