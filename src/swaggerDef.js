const packageJSON = require('../package.json');

module.exports = {
    info: {
        title: 'THX API Specification',
        version: packageJSON.version,
    },
    apis: ['src/controllers/**/*.ts'],
    basePath: '/v1',
    securityDefinitions: {
        bearerAuth: {
            description: 'Value: Bearer {jwt}',
            type: 'apiKey',
            name: 'Authorization',
            scheme: 'bearer',
            in: 'header',
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};
