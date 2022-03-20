import swaggerJsdoc from 'swagger-jsdoc';
import packageJSON from '../../package.json';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'THX API Specification',
            version: packageJSON.version,
        },
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
    },
    apis: ['./src/controllers/**/*.ts'],
};

export const openapiSpecification = swaggerJsdoc(options);
