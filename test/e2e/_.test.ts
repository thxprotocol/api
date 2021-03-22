import mongoose from 'mongoose';
import db from '../../src/util/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { deployAssetPoolFactory, deployPoolRegistry } from '../../src/util/factory';
import MongoAdapter from '../../src/oidc/adapter';
import { admin } from '../../src/util/network';

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

    console.log('Start Factory Deployment: ');

    const factoryAddress = await deployAssetPoolFactory(admin);
    console.log('Factory: ', factoryAddress);
    const registryAddress = await deployPoolRegistry(admin);
    console.log('Registry: ', registryAddress);
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

// require('./api.ts');
// require('./oidc.ts');
// require('./voting.ts');
// require('./unlimitedToken.ts');
// require('./bypasspoll.ts');
// require('./roles.ts');
// require('./encrypt.ts');
require('./gasStation.ts');
// require('./auth.ts');
