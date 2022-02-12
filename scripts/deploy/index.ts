import { NetworkProvider } from '../../src/util/network';
import { deployFactory } from './lib/factory';
import { deployFacets } from './lib/facets';
import { deployRegistry } from './lib/registry';
import { logger } from '../../src/util/logger';
logger.level = 'warning';

async function deploy(network: NetworkProvider.Test | NetworkProvider.Main) {
    console.log('Facets: ', await deployFacets(NetworkProvider.Main));
    console.log('Factory: ', await deployFactory(NetworkProvider.Main));
    console.log('Registry: ', await deployRegistry(NetworkProvider.Main));

    // console.log('Facets:', await deployFacets(network));
    // console.log('Asset Pool Factory: ', await deployFactory(network));
    // console.log('Asset Pool Registry:', await deployRegistry(network));
    console.log('*** UPDATE YOUR .ENV ***');
}

deploy(NetworkProvider.Main)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
