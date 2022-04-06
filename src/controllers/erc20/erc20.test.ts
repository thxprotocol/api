import request from 'supertest';

import app from '@/app';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { isAddress } from 'ethers/lib/utils';

describe('ERC20', () => {
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
                    type: ERC20Type.Limited,
                });
            expect(response.body?.totalSupply).toEqual(TOTAL_SUPPLY);
        });

        it('Able to create unlimited token and return address', async () => {
            const response = await requester.post('/v1/erc20').set('Authorization', ACCESS_TOKEN).send({
                name: 'Test Token',
                symbol: 'TTK',
                network: NetworkProvider.Main,
                totalSupply: 0,
                type: ERC20Type.Unlimited,
            });

            expect(response.body.address).toBeDefined();
            expect(isAddress(response.body.address)).toBe(true);
        });

        it('Able to return list of created token', async () => {
            const response = await requester.get('/v1/erc20').set('Authorization', ACCESS_TOKEN);
            expect(response.body.length).toEqual(2);
        });
    });
});
