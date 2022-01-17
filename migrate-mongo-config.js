const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    migrationFileExtension: '.js',
    mongodb: {
        url: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    migrationsDir: 'migrations',
    changelogCollectionName: 'changelog',
    useFileHash: false,
};
