import swaggerAutogen from 'swagger-autogen';
import { version } from '../../package.json';
import { NODE_ENV } from './secrets';

const doc: any = {
    info: {
        version,
        title: 'THX API Specification',
        description: 'User guides are available at https://docs.thx.network.', // by default: ''
    },
    host: 'https://api.thx.network',
    basePath: '/v1',
    schemes: ['https'],
};
const outputFile = './openapi.json';
const endpointsFiles = ['./src/controllers/index.ts'];

if (NODE_ENV !== 'test') {
    swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
        await import('../app');
    });
}
