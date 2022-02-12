// Provide a test suite for all controllers on a microservice level

import request from 'supertest';
import { isAddress } from 'web3-utils';

import server from '../../../src/server';
import db from '../../../src/util/database';
import { tokenName, tokenSymbol } from '../../../test/e2e/lib/constants';
import { getToken } from '../../../test/e2e/lib/jwt';
import { mockClear, mockStart } from '../../../test/e2e/lib/mock';
import { agenda } from '../../util/agenda';
import { NetworkProvider } from '../../util/network';

const http = request.agent(server);

describe('PromoCodes', () => {
    let poolAddress: string, adminAccessToken: string, userAccessToken: string, dashboardAccessToken: string;

    beforeAll(async () => {
        mockStart();
        dashboardAccessToken = getToken('openid dashboard promo_codes:read promo_codes:write');
    });

    // This should move to a more abstract level and be effective
    // for every test
    afterAll(async () => {
        await agenda.stop();
        await agenda.close();
        await db.disconnect();
        server.close();
        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            http.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: {
                        symbol: tokenSymbol,
                        name: tokenName,
                        totalSupply: 0,
                    },
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });
    });

    it('should work!', () => {
        http.post('/v1/promo_codes')
            .set({ Authorization: dashboardAccessToken, AssetPool: poolAddress })
            .send({
                value: 'wawgwagaw',
                expiry: Date.now(),
            })
            .expect(({ body }: Response) => {
                expect(body).toBeDefined();
            })
            .expect(201);
    });
});
