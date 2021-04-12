import mongoose from 'mongoose';
import db from '../../src/util/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { deployAssetPoolFactory, deployPoolRegistry } from '../../src/util/factory';
import MongoAdapter from '../../src/oidc/adapter';
import { getAdmin, NetworkProvider } from '../../src/util/network';

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

    const admin = getAdmin(NetworkProvider.Test);
    const factoryAddress = await deployAssetPoolFactory(admin);
    console.log('Factory: ', factoryAddress);
    const registryAddress = await deployPoolRegistry(admin);
    console.log('Registry: ', registryAddress);
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

require('./api.ts');
require('./oidc_admin.ts');
require('./voting.ts');
require('./unlimited_token.ts');
require('./bypass_polls.ts');
require('./roles.ts');
require('./encrypt.ts');
require('./gas_station.ts');
