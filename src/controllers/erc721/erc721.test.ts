import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { isAddress } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { dashboardAccessToken } from '@/util/jest/constants';

const user = request.agent(app);

describe('ERC721', () => {
    const network = NetworkProvider.Main,
        name = 'Planets of the Galaxy',
        symbol = 'GLXY',
        description = 'Collection full of rarities.',
        schema = [
            { name: 'color', propType: 'string', description: 'lorem ipsum' },
            { name: 'size', propType: 'string', description: 'lorem ipsum dolor sit' },
        ];
    let erc721ID: string, tokenId: number;

    beforeAll(async () => {
        await beforeAllCallback();
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
                    expect(body.network).toBe(network);
                    expect(body.name).toBe(name);
                    expect(body.symbol).toBe(symbol);
                    expect(body.description).toBe(description);
                    expect(body.properties[0].description).toBe(schema[0].description);
                    expect(body.properties[0].name).toBe(schema[0].name);
                    expect(body.properties[0].propType).toBe(schema[0].propType);
                    expect(body.properties[1].description).toBe(schema[1].description);
                    expect(body.properties[1].name).toBe(schema[1].name);
                    expect(body.properties[1].propType).toBe(schema[1].propType);
                    expect(isAddress(body.address)).toBe(true);

                    erc721ID = body._id;
                })
                .expect(201, done);
        });
    });

    describe('GET /erc721/:id', () => {
        it('should return contract details', (done) => {
            user.get('/v1/erc721/' + erc721ID)
                .set('Authorization', dashboardAccessToken)
                .send()
                .expect(({ body }: request.Response) => {
                    expect(body.network).toBe(network);
                    expect(body.name).toBe(name);
                    expect(body.symbol).toBe(symbol);
                    expect(body.description).toBe(description);
                    expect(body.properties[0].description).toBe(schema[0].description);
                    expect(body.properties[0].name).toBe(schema[0].name);
                    expect(body.properties[0].propType).toBe(schema[0].propType);
                    expect(body.properties[1].description).toBe(schema[1].description);
                    expect(body.properties[1].name).toBe(schema[1].name);
                    expect(body.properties[1].propType).toBe(schema[1].propType);
                    expect(isAddress(body.address)).toBe(true);
                })
                .expect(200, done);
        });
        it('should 400 for invalid ID', (done) => {
            user.get('/v1/erc721/' + 'invalid_id')
                .set('Authorization', dashboardAccessToken)
                .send()
                .expect(({ body }: request.Response) => {
                    expect(body.errors[0].msg).toContain('Invalid value');
                })
                .expect(400, done);
        });
        it('should 404 if not known', (done) => {
            user.get('/v1/erc721/' + '62397f69760ac5f9ab4454df')
                .set('Authorization', dashboardAccessToken)
                .send()
                .expect(({ body }: request.Response) => {
                    expect(body.error.message).toContain('Not Found');
                })
                .expect(404, done);
        });
    });
});
