import request from 'supertest';

import app from '@/app';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getToken } from '@/util/jest/jwt';
import { isAddress } from 'ethers/lib/utils';
import { dashboardAccessToken} from '@/util/jest/constants';

const http = request.agent(app);

describe('ERC20', () => {
    const ACCESS_TOKEN = dashboardAccessToken;
    let tokenId: string;

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(async () => {
        await afterAllCallback();
    });

    describe('POST /erc20', () => {
        const TOTAL_SUPPLY = 1000;

        it('Able to create limited token and return address', (done) => {
            http.post('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    name: 'Test Token',
                    symbol: 'TTK',
                    network: NetworkProvider.Main,
                    totalSupply: TOTAL_SUPPLY,
                    type: ERC20Type.Limited,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.totalSupply).toEqual(TOTAL_SUPPLY);
                })
                .expect(201, done);
        });

        it('Able to create unlimited token and return address', (done) => {
            http.post('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    name: 'Test Token',
                    symbol: 'TTK',
                    network: NetworkProvider.Main,
                    totalSupply: 0,
                    type: ERC20Type.Unlimited,
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    expect(isAddress(body._id)).toBeDefined();
                    tokenId = body._id;
                })
                .expect(201, done);
        });

        it('Able to return list of created token', (done) => {
            http.get('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .expect(({ body }: request.Response) => {
                    expect(body.length).toEqual(2);
                })
                .expect(200, done);
        });

        it('Able to return a created token', (done) => {
            http.get('/v1/erc20/' + tokenId)
                .set('Authorization', ACCESS_TOKEN)
                .expect(({ body }: request.Response) => {
                    expect(body).toBeDefined();
                })
                .expect(200, done);
        });
    });
});
