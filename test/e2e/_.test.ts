import mongoose from 'mongoose';
import db from '../../src/util/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { deployAssetPoolFactory } from '../../scripts/lib/factory';
import { deployPoolRegistry } from '../../scripts/lib/registry';
import MongoAdapter from '../../src/oidc/adapter';
import { NetworkProvider } from '../../src/util/network';

beforeAll(async () => {
    const memServer = new MongoMemoryServer({
        instance: {
            ip: 'localhost',
            port: 27027,
            dbName: 'test',
        },
        autoStart: true,
    });

    await memServer.ensureInstance();

    await MongoAdapter.connect();

    // const factoryAddress = await deployAssetPoolFactory(NetworkProvider.Test);
    // console.log('Factory: ', factoryAddress);
    // const registryAddress = await deployPoolRegistry(NetworkProvider.Test);
    // console.log('Registry: ', registryAddress);
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

require('./dummy.ts');
// require('./api.ts');
// require('./oidc_admin.ts');
// require('./voting.ts');
// require('./unlimited_token.ts');
// require('./bypass_polls.ts');
// require('./roles.ts');
// require('./encrypt.ts');
// require('./gas_station.ts');
// require('./withdrawBypass.ts');
