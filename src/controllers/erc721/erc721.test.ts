import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';

const user = request.agent(app);

describe('ERC721', () => {
    let dashboardAccessToken: string, erc721ID: string;

    beforeAll(async () => {
        await beforeAllCallback();
        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/erc721')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    name: 'PolyPunks',
                    symbol: 'POLYPNKS',
                    description: 'Collection full of rarities.',
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                })
                .expect(201, done);
        });
    });
});
