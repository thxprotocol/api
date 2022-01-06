import db from '../../src/util/database';
import server from '../../src/server';
import { deployFacets } from '../../scripts/lib/facets';
import { deployFactory } from '../../scripts/lib/factory';
import { deployRegistry } from '../../scripts/lib/registry';
import { getProvider, NetworkProvider } from '../../src/util/network';
import { ASSET_POOL_FACTORY_ADDRESS, POOL_REGISTRY_ADDRESS } from '../../src/util/secrets';

beforeAll(async (done) => {
    const web3 = getProvider(NetworkProvider.Test);
    const factoryExists = (await web3.eth.getCode(ASSET_POOL_FACTORY_ADDRESS)) !== '0x';
    const registryExists = (await web3.eth.getCode(POOL_REGISTRY_ADDRESS)) !== '0x';

    if (!factoryExists || !registryExists) {
        console.log('Facets: ', await deployFacets(NetworkProvider.Test));
        console.log('Factory: ', await deployFactory(NetworkProvider.Test));
        console.log('Registry: ', await deployRegistry(NetworkProvider.Test));
    } else {
        console.log('Factory and registry available!');
    }

    done();
});

afterAll(async () => {
    await db.disconnect();
    await server.close();
});

require('./api.ts');
require('./widgets.ts');
require('./signup.ts');
require('./bypass_polls.ts');
require('./propose_withdrawal.ts');
require('./unlimited_token.ts');
require('./voting.ts');
require('./roles.ts');
require('./gas_station.ts');
