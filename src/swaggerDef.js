const packageJSON = require('../package.json');

module.exports = {
    info: {
        title: 'THX API Specification',
        version: packageJSON.version,
    },
    apis: ['src/controllers/**/*.ts'],
    basePath: 'https://api.thx.network/v1',
};
