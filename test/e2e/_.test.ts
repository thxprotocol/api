import db from '../../src/util/database';
import server from '../../src/server';
import { deployFacets } from '../../scripts/lib/facets';
import { deployFactory } from '../../scripts/lib/factory';
import { deployRegistry } from '../../scripts/lib/registry';
import { getProvider, NetworkProvider } from '../../src/util/network';
import { ASSET_POOL_FACTORY_ADDRESS, MAXIMUM_GAS_PRICE, POOL_REGISTRY_ADDRESS } from '../../src/util/secrets';
import { agenda } from '../../src/util/agenda';
import { mockClear, mockUrl } from './lib/mock';
import { Job } from '../../src/models/Job';

beforeAll(async () => {
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

    // Remove persistent jobs that are not known in the bundle
    // agenda.purge() should do that, but does not work for some reason
    await Job.deleteMany({});

    // Mock gas price to be lower than configured cap for all tests. Be aware that
    // the tx_queue test will override this mock.
    mockUrl('get', 'https://gpoly.blockscan.com', '/gasapi.ashx?apikey=key&method=gasoracle', 200, {
        result: {
            FastGasPrice: (MAXIMUM_GAS_PRICE - 1).toString(),
        },
    });
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
