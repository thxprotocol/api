import db from '../../src/util/database';
import server from '../../src/server';
import { deployFacets } from '../../scripts/lib/facets';
import { deployFactory } from '../../scripts/lib/factory';
import { deployRegistry } from '../../scripts/lib/registry';
import { getProvider, NetworkProvider } from '../../src/util/network';
import { ASSET_POOL_FACTORY_ADDRESS, POOL_REGISTRY_ADDRESS } from '../../src/util/secrets';
import { agenda } from '../../src/util/agenda';
import { mockClear, mockStart } from './lib/mock';

beforeAll(async () => {
    const { web3 } = getProvider(NetworkProvider.Main);
    const factoryExists = (await web3.eth.getCode(ASSET_POOL_FACTORY_ADDRESS)) !== '0x';
    const registryExists = (await web3.eth.getCode(POOL_REGISTRY_ADDRESS)) !== '0x';

    mockStart();

    if (!factoryExists || !registryExists) {
        console.log('Facets: ', await deployFacets(NetworkProvider.Main));
        console.log('Factory: ', await deployFactory(NetworkProvider.Main));
        console.log('Registry: ', await deployRegistry(NetworkProvider.Main));
    } else {
        console.log('Factory and registry available!');
    }
});

afterAll(async () => {
    await agenda.stop();
    await agenda.close();

    await db.disconnect();

    server.close();

    mockClear();
});

require('./api.ts');
require('./widgets.ts');
require('./signup.ts');
require('./bypass_polls.ts');
require('./propose_withdrawal.ts');
require('./unlimited_token.ts');
require('./voting.ts');
require('./gas_station.ts');
require('./roles.ts');
require('./transaction_queue.ts');
