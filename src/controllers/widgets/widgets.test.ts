import request from 'supertest';
import app from '@/app';
import { ChainId } from '@/types/enums';
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

    let poolId: string, testToken: Contract, clientId: string;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(ChainId.Hardhat, 'LimitedSupplyToken');
    });

    afterAll(afterAllCallback);

    describe('POST /pools', () => {
        it('HTTP 200', (done) => {
            user.post('/v1/pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    chainId: ChainId.Hardhat,
                    tokens: [testToken.options.address],
                })
                .expect(({ body }: request.Response) => {
                    poolId = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /rewards', () => {
        it('HTTP 200', async () => {
            await user
                .post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
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
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send({
                    metadata: {
                        rewardId,
                        poolId,
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
            user.get('/v1/widgets?poolId=' + poolId)
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
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
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.requestUris[0]).toBe(requestUris[0]);
                    expect(res.body.clientId).toBeDefined();
                    expect(res.body.clientSecret).toBeDefined();
                    expect(res.body.metadata.rewardId).toBe(rewardId);
                    expect(res.body.metadata.poolId).toBe(poolId);
                })
                .expect(200, done);
        });
    });
});
