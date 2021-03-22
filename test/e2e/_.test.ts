import mongoose from 'mongoose';
import db from '../../src/util/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { deployAssetPoolFactory } from './lib/contracts';
import MongoAdapter from '../../src/oidc/adapter';

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

    await deployAssetPoolFactory();
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

require('./api.ts');
require('./oidc.ts');
require('./voting.ts');
require('./unlimitedToken.ts');
require('./bypasspoll.ts');
require('./roles.ts');
require('./encrypt.ts');
require('./gasStation.ts');
// require('./auth.ts');
