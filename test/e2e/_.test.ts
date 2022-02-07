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

require('./api.test');
require('./widgets.test');
require('./signup.test');
require('./bypass_polls.test');
require('./propose_withdrawal.test');
require('./unlimited_token.test');
require('./voting.test');
require('./gas_station.test');
require('./roles.test');
require('./transaction_queue.test');
