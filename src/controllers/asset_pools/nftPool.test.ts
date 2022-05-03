import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { account2 } from '@/util/jest/constants';

const user = request.agent(app);

describe('NFT Pool', () => {
    let dashboardAccessToken: string, poolAddress: string, tokenAddress: string, erc721ID: string, metadataId: string;
    const network = NetworkProvider.Main,
        name = 'Planets of the Galaxy',
        symbol = 'GLXY',
        description = 'Collection full of rarities.',
        schema = [
            { name: 'color', propType: 'string', description: 'lorem ipsum' },
            { name: 'size', propType: 'string', description: 'lorem ipsum dolor sit' },
        ];

    beforeAll(async () => {
        await beforeAllCallback();
        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /erc721', () => {
        it('should create and return contract details', (done) => {
            user.post('/v1/erc721')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network,
                    name,
                    symbol,
                    description,
                    schema,
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.address).toBeDefined();
                    tokenAddress = body.address;
                    erc721ID = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: tokenAddress,
                    variant: 'nftPool',
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    poolAddress = body.address;
                })
                .expect(201, done);
        });
    });

    describe('POST /erc721/:id/metadata', () => {
        it('should 201 when token is minted', (done) => {
            user.post('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('AssetPool', poolAddress)
                .send({
                    metadata: [
                        { key: schema[0].name, value: 'red' },
                        { key: schema[1].name, value: 'large' },
                    ],
                    // beneficiary,
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    // expect(body.tokenId).toBe(1);
                    expect(body[schema[0].name]).toBe('red');
                    expect(body[schema[1].name]).toBe('large');
                    metadataId = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /erc721/:id/metadata/:metadataId/mint', () => {
        it('should 201 when token is minted', (done) => {
            const beneficiary = account2.address;

            user.post('/v1/erc721/' + erc721ID + '/metadata/' + metadataId + '/mint')
                .set('Authorization', dashboardAccessToken)
                .set('AssetPool', poolAddress)
                .send({
                    beneficiary,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.tokenId).toBe(1);
                })
                .expect(201, done);
        });
    });

    describe('GET /metadata/:metadataId', () => {
        it('should return metadata for metadataId', (done) => {
            user.get('/v1/metadata/' + metadataId)
                .set('Authorization', dashboardAccessToken)
                .send()
                .expect(({ body }: request.Response) => {
                    expect(body[schema[0].name]).toBe('red');
                    expect(body[schema[1].name]).toBe('large');
                })
                .expect(200, done);
        });
    });
});
