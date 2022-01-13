import { MONGODB_URI } from './src/util/secrets';

export = {
    migrationFileExtension: '.ts',
    mongodb: {
        url: MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    migrationsDir: 'migrations',
    changelogCollectionName: 'changelog',
    useFileHash: false,
};
