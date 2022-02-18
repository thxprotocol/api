import request from 'supertest';
import app from '@/app';
import { deployExampleToken, timeTravel } from '@/util/jest/network';
import { rewardPollDuration, rewardWithdrawAmount, rewardWithdrawDuration } from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { NetworkProvider } from '@/util/network';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';

const user = request.agent(app);

describe('Bypass Polls', () => {
    let adminAccessToken: string,
        dashboardAccessToken: string,
        redirectURL: string,
        poolAddress: string,
        testToken: Contract;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = await deployExampleToken();

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('HTTP 201 response OK', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });

        it('HTTP 200 response OK', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.bypassPolls).toBe(true);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards 1 (bypass enabled)', () => {
        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 reward storage OK ', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.state).toBe(1);
                    expect(res.body.withdrawAmount).toBe(rewardWithdrawAmount);
                    expect(res.body.withdrawDuration).toBe(rewardWithdrawDuration);
                    expect(res.body.poll).toBeUndefined();
                })
                .expect(200, done);
        });
    });

    describe('PATCH /rewards/1', () => {
        it('HTTP 200 if values are identical to current values', (done) => {
            user.patch('/v1/rewards/1')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect((res: request.Response) => {
                    expect(res.body.withdrawAmount).toBe(rewardWithdrawAmount);
                    expect(res.body.withdrawDuration).toBe(rewardWithdrawDuration);
                })
                .expect(200, done);
        });

        it('HTTP 200 response OK', (done) => {
            user.patch('/v1/rewards/1')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount * 2,
                })
                .expect((res: request.Response) => {
                    expect(res.body.state).toBe(1);
                    expect(res.body.withdrawAmount).toBe(rewardWithdrawAmount * 2);
                    expect(res.body.poll).toBeUndefined();
                })
                .expect(200, done);
        });
    });

    describe('PATCH /asset_pools/:address (bypassPolls = false)', () => {
        it('HTTP 302 redirect to pool', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: dashboardAccessToken,
                })
                .send({ bypassPolls: false, rewardPollDuration })
                .expect(200, done);
        });

        it('HTTP 200 response OK', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.bypassPolls).toBe(false);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards 2 (bypass disabled)', () => {
        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 reward storage OK ', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.state).toBe(0);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/2/finalize (bypass disabled)', () => {
        it('HTTP 200 reward storage OK', async () => {
            await timeTravel(rewardPollDuration);
            await user
                .post('/v1/rewards/2/poll/finalize')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.state).toBe(0);
                })
                .expect(200);
        });
    });

    describe('PATCH /asset_pools/:address (bypassPolls = true)', () => {
        it('HTTP 302 redirect to pool', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: dashboardAccessToken,
                })
                .send({ bypassPolls: true })
                .expect(200, done);
        });

        it('HTTP 200 response OK', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .expect((res: request.Response) => {
                    expect(res.body.bypassPolls).toBe(true);
                })
                .expect(200, done);
        });
    });
});
