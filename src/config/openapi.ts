import swaggerAutogen from 'swagger-autogen';
import m2s from 'mongoose-to-swagger';
import { version } from '../../package.json';
import { NODE_ENV } from './secrets';
import ERC20 from '@/models/ERC20';
import Brand from '@/models/Brand';
import { ERC721 } from '@/models/ERC721';
import { ERC20Token } from '@/models/ERC20Token';
import { ERC20SwapRule } from '@/models/ERC20SwapRule';
import { ERC20Swap } from '@/models/ERC20Swap';
import { ERC721Metadata } from '@/models/ERC721Metadata';
import { ERC721Token } from '@/models/ERC721Token';
import { Payment } from '@/models/Payment';
import { Promotion } from '@/models/Promotion';
import { Reward } from '@/models/Reward';
import { Transaction } from '@/models/Transaction';
import { Withdrawal } from '@/models/Withdrawal';
import { AssetPool } from '@/models/AssetPool';
import { Claim } from '@/models/Claim';
import { Client } from '@/models/Client';
import { Deposit } from '@/models/Deposit';

const doc: any = {
    info: {
        version,
        title: 'THX API Specification',
        description: 'User guides are available at https://docs.thx.network.', // by default: ''
    },
    host: 'api.thx.network',
    basePath: '/v1',
    schemes: ['https', 'http'],
    securityDefinitions: {
        apiKeyAuth: {
            type: 'string',
            in: 'header',
            name: 'X-PoolId',
            description: 'This header is used to verify ownership of the pool you are interacting with.',
        },
    },
    definitions: {
        AssetPool: m2s(AssetPool).properties,
        Brand: m2s(Brand).properties,
        Claim: m2s(Claim).properties,
        Client: m2s(Client).properties,
        Deposit: m2s(Deposit).properties,
        ERC20: m2s(ERC20).properties,
        ERC20Swap: m2s(ERC20Swap).properties,
        ERC20SwapRule: m2s(ERC20SwapRule).properties,
        ERC20Token: m2s(ERC20Token).properties,
        ERC721: m2s(ERC721).properties,
        ERC721Metadata: m2s(ERC721Metadata).properties,
        ERC721Token: m2s(ERC721Token).properties,
        Payment: m2s(Payment).properties,
        Promotion: m2s(Promotion).properties,
        Reward: m2s(Reward).properties,
        Transaction: m2s(Transaction).properties,
        Withdrawal: m2s(Withdrawal).properties,
    },
};
const outputFile = './openapi.json';
const endpointsFiles = ['./src/controllers/index.ts'];

if (!['test', 'production'].includes(NODE_ENV)) {
    swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
        await import('../app');
    });
}
