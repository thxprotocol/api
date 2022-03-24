import request from 'supertest';

import app from '@/app';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { NetworkProvider } from '@/types/enums';

describe('/token/erc20/*', () => {
    const requester = request.agent(app);

    const ACCESS_TOKEN = getToken('openid dashboard');

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(async () => {
        await afterAllCallback();
    });

    describe('POST /token/erc20', () => {
        const TOTAL_SUPPLY = 1000;

        it('Able to create token and return detail', async () => {
            console.log(ACCESS_TOKEN);
            const response = await requester
                .post('/v1/token/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    name: 'Test Token',
                    symbol: 'TTK',
                    network: NetworkProvider.Test,
                    totalSupply: `${TOTAL_SUPPLY}`,
                });

            expect(response.status).toBe(200);
        });
    });
});
