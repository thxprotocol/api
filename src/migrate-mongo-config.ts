import { MONGODB_URI } from './util/secrets';

export = {
    migrationFileExtension: '.ts',
    mongodb: {
        url: MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    migrationsDir: 'src/migrations',
    changelogCollectionName: 'changelog',
    useFileHash: false,
};
