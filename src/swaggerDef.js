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
            description:
                'JWT Authorization header using the Bearer scheme. \r\n\r\n Enter \'Bearer\' [space] and then your token in the text input below.\r\n\r\nExample: "Bearer 12345abcdef"',
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
    components: {
        responses: {
            400: {
                description: 'Bad Request. Indicates incorrect body parameters',
            },
            401: {
                description: 'Unauthorized. Authenticate your request please.',
            },
            500: {
                description: 'Internal Server Error.',
            },
            502: {
                description: 'Bad Gateway. Received an invalid response from the network or database.',
            },
        },
    },
};
