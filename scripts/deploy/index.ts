import { NetworkProvider } from '../../src/util/network';
import { deployFactory } from './lib/factory';
import { deployFacets } from './lib/facets';
import { deployRegistry } from './lib/registry';
import { logger } from '../../src/util/logger';
logger.level = 'warning';

const names = {
    [NetworkProvider.Main]: 'Main',
    [NetworkProvider.Test]: 'Test',
};

async function deploy(network: NetworkProvider.Test | NetworkProvider.Main) {
    console.log(`Facets: [${names[network]}]`, await deployFacets(network));
    console.log(`Factory: [${names[network]}]`, await deployFactory(network));
    console.log(`Registry: [${names[network]}]`, await deployRegistry(network));
    console.log('*** UPDATE YOUR .ENV ***');
}

const arg: any = null;
const jobs = [];
if (arg) {
    const provider = arg.toLocaleLowerCase() === 'main' ? NetworkProvider.Main : NetworkProvider.Test;
    console.log('Deploying to network', names[provider]);
    jobs.push(deploy(provider));
} else {
    console.log('Deploying to Main and Test');

    jobs.push(deploy(NetworkProvider.Main));
    jobs.push(deploy(NetworkProvider.Test));
}

Promise.all(jobs)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
