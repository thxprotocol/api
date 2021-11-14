import dotenv from 'dotenv';

dotenv.config();

export = {
    migrationFileExtension: '.ts',
    mongodb: {
        url: process.env.MONGODB_URI,
        databaseName: process.env.MONGODB_NAME,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    migrationsDir: 'migrations',
    changelogCollectionName: 'changelog',
    useFileHash: false,
};
