import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import {
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    rewardWithdrawUnlockDate,
    rewardId,
    requestUris,
    redirectUris,
    postLogoutRedirectUris,
    dashboardAccessToken,
} from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContract } from '@/config/contracts';

const user = request.agent(app);

describe('Widgets', () => {
    const title = 'Welcome Package',
        slug = 'welcome-package';

    let poolAddress: string, testToken: Contract, clientId: string;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(NetworkProvider.Main, 'LimitedSupplyToken');
    });

    afterAll(afterAllCallback);

    describe('POST /pools', () => {
        it('HTTP 200', (done) => {
            user.post('/v1/pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: NetworkProvider.Main,
                    tokens: [testToken.options.address],
                })
                .expect(({ body }: request.Response) => {
                    poolAddress = body.address;
                })
                .expect(201, done);
        });
    });

    describe('POST /rewards', () => {
        it('HTTP 200', async () => {
            await user
                .post('/v1/rewards/')
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .send({
                    title,
                    slug,
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                    withdrawUnlockDate: rewardWithdrawUnlockDate,
                })
                .expect(201);
        });
    });

    describe('POST /widgets/', () => {
        it('HTTP 200', (done) => {
            user.post('/v1/widgets/')
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .send({
                    metadata: {
                        rewardId,
                        poolAddress,
                    },
                    requestUris,
                    redirectUris,
                    postLogoutRedirectUris,
                })
                .expect(201, done);
        });
    });

    describe('GET /widgets', () => {
        it('HTTP 200', (done) => {
            user.get('/v1/widgets?asset_pool=' + poolAddress)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.length).toBe(1);
                    clientId = res.body[0];
                })
                .expect(200, done);
        });
    });

    describe('GET /widgets/:clientId', () => {
        it('HTTP 200', (done) => {
            user.get('/v1/widgets/' + clientId)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.requestUris[0]).toBe(requestUris[0]);
                    expect(res.body.clientId).toBeDefined();
                    expect(res.body.clientSecret).toBeDefined();
                    expect(res.body.metadata.rewardId).toBe(rewardId);
                    expect(res.body.metadata.poolAddress).toBe(poolAddress);
                })
                .expect(200, done);
        });
    });
});
