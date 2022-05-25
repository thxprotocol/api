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

    describe('POST /pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/pools')
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
        const recipient = account2.address,
            title = 'NFT title',
            description = 'NFT description',
            value1 = 'red',
            value2 = 'large';

        it('should return tokenId when token is minted', (done) => {
            user.post('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('AssetPool', poolAddress)
                .send({
                    title,
                    description,
                    attributes: [
                        { key: schema[0].name, value: value1 },
                        { key: schema[1].name, value: value2 },
                    ],
                    recipient,
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.tokens[0].tokenId).toBe(1);
                    expect(body.tokens[0].recipient).toBe(recipient);
                    expect(body.title).toBe(title);
                    expect(body.description).toBe(description);
                    expect(body.attributes[0].key).toBe(schema[0].name);
                    expect(body.attributes[0].value).toBe(value1);
                    expect(body.attributes[1].key).toBe(schema[1].name);
                    expect(body.attributes[1].value).toBe(value2);
                })
                .expect(201, done);
        });

        it('should return no tokenId when metadata is created', (done) => {
            const title = 'NFT title 2',
                description = 'NFT description 2',
                value1 = 'blue',
                value2 = 'small';

            user.post('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('AssetPool', poolAddress)
                .send({
                    title,
                    description,
                    attributes: [
                        { key: schema[0].name, value: value1 },
                        { key: schema[1].name, value: value2 },
                    ],
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.title).toBe(title);
                    expect(body.description).toBe(description);
                    expect(body.attributes[0].key).toBe(schema[0].name);
                    expect(body.attributes[0].value).toBe(value1);
                    expect(body.attributes[1].key).toBe(schema[1].name);
                    expect(body.attributes[1].value).toBe(value2);
                    metadataId = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /erc721/:id/metadata/:metadataId/mint', () => {
        it('should 201 when token is minted', (done) => {
            const recipient = account2.address;

            user.post('/v1/erc721/' + erc721ID + '/metadata/' + metadataId + '/mint')
                .set('Authorization', dashboardAccessToken)
                .set('AssetPool', poolAddress)
                .send({
                    recipient,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.tokens[0].tokenId).toBe(2);
                    expect(body.tokens[0].recipient).toBe(recipient);
                })
                .expect(201, done);
        });
    });

    describe('GET /metadata/:metadataId', () => {
        const value1 = 'blue',
            value2 = 'small';

        it('should return metadata for metadataId', (done) => {
            user.get('/v1/metadata/' + metadataId)
                .set('Authorization', dashboardAccessToken)
                .send()
                .expect(({ body }: request.Response) => {
                    expect(body[schema[0].name]).toBe(value1);
                    expect(body[schema[1].name]).toBe(value2);
                })
                .expect(200, done);
        });
    });
});
