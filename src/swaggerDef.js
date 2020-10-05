const packageJson = require('../package.json');

module.exports = {
    info: {
        title: 'THX API Specification',
        version: packageJson.version,
    },
    apis: ['src/controllers/**/*.ts'],
    basePath: 'https://api.thx.network/v1',
};
