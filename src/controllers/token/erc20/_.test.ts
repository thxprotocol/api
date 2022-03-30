import request from 'supertest';

import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { isAddress } from 'ethers/lib/utils';

describe('/erc20/*', () => {
    const requester = request.agent(app);

    const ACCESS_TOKEN = getToken('openid dashboard');

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(async () => {
        await afterAllCallback();
    });

    describe('POST /erc20', () => {
        const TOTAL_SUPPLY = 1000;

        it('Able to create limited token and return address', async () => {
            const response = await requester
                .post('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    name: 'Test Token',
                    symbol: 'TTK',
                    network: NetworkProvider.Main,
                    totalSupply: `${TOTAL_SUPPLY}`,
                });

            expect(response.body?.totalSupply).toEqual(String(TOTAL_SUPPLY));
        });

        it('Able to create unlimited token and return address', async () => {
            const response = await requester.post('/v1/erc20').set('Authorization', ACCESS_TOKEN).send({
                name: 'Test Token',
                symbol: 'TTK',
                network: NetworkProvider.Main,
                totalSupply: '0',
            });

            expect(response.body.address).toBeDefined();
            expect(isAddress(response.body.address)).toBe(true);
        });

        it('Able to return list of created token', async () => {
            const response = await requester.get('/v1/erc20').set('Authorization', ACCESS_TOKEN);
            expect(response.body.tokens.length).toEqual(2);
        });
    });
});
