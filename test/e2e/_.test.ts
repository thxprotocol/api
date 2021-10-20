import mongoose from 'mongoose';
import db from '../../src/util/database';
import MongoAdapter from '../../src/oidc/adapter';
import { deployFacets } from '../../scripts/lib/facets';
import { deployFactory } from '../../scripts/lib/factory';
import { deployRegistry } from '../../scripts/lib/registry';
import { NetworkProvider } from '../../src/util/network';

beforeAll(async () => {
    console.log('Facets: ', await deployFacets(NetworkProvider.Test));
    console.log('Factory: ', await deployFactory(NetworkProvider.Test));
    console.log('Registry: ', await deployRegistry(NetworkProvider.Test));

    await MongoAdapter.connect();
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

// require('./encrypt.ts');
require('./api.ts');
require('./signup.ts');
require('./bypass_polls.ts');
require('./propose_withdrawal.ts');
require('./unlimited_token.ts');
require('./voting.ts');
require('./roles.ts');
require('./gas_station.ts');
require('./oidc_admin.ts');
require('./widgets.ts');
