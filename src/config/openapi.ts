import swaggerAutogen from 'swagger-autogen';
import { version } from '../../package.json';
import { NODE_ENV } from './secrets';

const doc: any = {
    info: {
        version,
        title: 'THX API Specification',
        description: 'User guides are available at https://docs.thx.network.', // by default: ''
    },
    host: 'api.thx.network',
    basePath: '/v1',
    schemes: ['https', 'http'],
};
const outputFile = './openapi.json';
const endpointsFiles = ['./src/controllers/index.ts'];

if (!['test', 'production'].includes(NODE_ENV)) {
    swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
        await import('../app');
    });
}
