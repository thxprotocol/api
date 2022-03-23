import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { account2 } from '@/util/jest/constants';

const user = request.agent(app);

describe('ERC721', () => {
    const network = NetworkProvider.Main,
        name = 'PolyPunks',
        symbol = 'POLYPNKS',
        description = 'Collection full of rarities.';
    let dashboardAccessToken: string, erc721ID: string;

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
                })
                .expect(({ body }: request.Response) => {
                    expect(body.id).toBeDefined();
                    expect(body.network).toBe(network);
                    expect(body.name).toBe(name);
                    expect(body.symbol).toBe(symbol);
                    expect(body.description).toBe(description);
                    expect(isAddress(body.address)).toBe(true);

                    erc721ID = body.id;
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

    describe('POST /erc721/:id/mint', () => {
        it('should 201 when token is minted', (done) => {
            const tokenUri = 'http://example.com/ip_records/42';
            const beneficiary = account2.address;

            user.get('/v1/erc721/' + erc721ID + '/mint')
                .set('Authorization', dashboardAccessToken)
                .send({
                    tokenUri,
                    beneficiary,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.tokenId).toBe(1);
                })
                .expect(201, done);
        });
    });
});
