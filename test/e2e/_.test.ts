import mongoose from 'mongoose';
import db from '../../src/util/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getAssetPoolFactory } from './lib/contracts';

beforeAll(async () => {
    const server = new MongoMemoryServer({
        instance: {
            ip: 'localhost',
            port: 27027,
            dbName: 'test',
        },
        autoStart: true,
    });

    await server.ensureInstance();

    const { AssetPoolFactory, diamondCut } = await getAssetPoolFactory();
    const diamond = await AssetPoolFactory.deploy(diamondCut);

    await diamond.deployed();
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
});

require('./api.ts');
// require('./auth.ts');
// require('./roles.ts');
// require('./encrypt.ts');
// require('./gasStation.ts');
