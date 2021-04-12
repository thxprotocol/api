import request from 'supertest';
import server from '../../src/server';
import { getAdmin, NetworkProvider } from '../../src/util/network';
import db from '../../src/util/database';
import { voter, timeTravel, signMethod } from './lib/network';
import { exampleTokenFactory } from './lib/network';
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
    userEmail,
    userPassword,
} from './lib/constants';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerClientCredentialsClient,
    registerDashboardClient,
    registerWalletClient,
} from './lib/registerClient';
import { solutionContract } from '../../src/util/network';
import { parseEther } from 'ethers/lib/utils';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Gas Station', () => {
    let poolAddress: any,
        adminAccessToken: string,
        adminAudience: string,
        dashboardAccessToken: string,
        userAccessToken: string,
        testToken: any;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);
        const admin = getAdmin(NetworkProvider.Test);

        adminAccessToken = credentials.accessToken;
        adminAudience = credentials.aud;

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();

        // Create an account
        await user.post('/v1/signup').set({ Authorization: adminAccessToken }).send({
            address: voter.address,
            email: 'test.api.bot@thx.network',
            password: 'mellon',
            confirmPassword: 'mellon',
        });

        const walletClient = await registerWalletClient(user);
        const walletHeaders = await getAuthHeaders(http2, walletClient, 'openid user email offline_access');
        const walletAuthCode = await getAuthCode(http2, walletHeaders, walletClient, {
            email: 'test.api.bot@thx.network',
            password: 'mellon',
        });

        const dashboardClient = await registerDashboardClient(user);
        const dashboardHeaders = await getAuthHeaders(http3, dashboardClient, 'openid dashboard');
        const dashboardAuthCode = await getAuthCode(http3, dashboardHeaders, dashboardClient, {
            email: userEmail,
            password: userPassword,
        });

        userAccessToken = await getAccessToken(http2, walletClient, walletAuthCode);
        dashboardAccessToken = await getAccessToken(http3, dashboardClient, dashboardAuthCode);

        // Create an asset pool
        const res = await user
            .post('/v1/asset_pools')
            .set({ Authorization: dashboardAccessToken })
            .send({
                title: poolTitle,
                aud: adminAudience,
                network: 0,
                token: {
                    address: testToken.address,
                },
            });

        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
        const amount = parseEther(rewardWithdrawAmount.toString());

        await testToken.approve(poolAddress, parseEther(rewardWithdrawAmount.toString()));
        await assetPool.deposit(amount);

        // Configure the default poll durations
        await user
            .patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
            .send({
                rewardPollDuration,
                proposeWithdrawPollDuration,
            });

        // Create a reward
        await user.post('/v1/rewards/').set({ AssetPool: poolAddress, Authorization: adminAccessToken }).send({
            withdrawAmount: rewardWithdrawAmount,
            withdrawDuration: rewardWithdrawDuration,
        });

        // Add a member
        await user
            .post('/v1/members')
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
            .send({ address: voter.address });
    });

    describe('GET /reward', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user
                .get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken });

            expect(body.state).toBe(0);
            done();
        });
    });

    describe('POST /gas_station/call (vote)', () => {
        it('HTTP 302 when call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], voter);
            const { status } = await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                });
            expect(status).toBe(200);

            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            const { status, body } = await user
                .get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken });
            expect(status).toBe(200);
            expect(body.poll.yesCounter).toBe(1);

            done();
        });
    });

    describe('POST /gas_station/base_poll (revokeVote)', () => {
        it('HTTP 302 when revokeVote call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollRevokeVote', [1], voter);
            const { status } = await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                });
            expect(status).toBe(200);

            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.poll.yesCounter).toBe(0);
                    done();
                });
        });
    });

    describe('POST /gas_station/base_poll (finalize)', () => {
        it('HTTP 302 when vote call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], voter);
            await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                });
            done();
        });

        it('HTTP 302 when finalize call is ok', async (done) => {
            await timeTravel(rewardPollDuration);

            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollFinalize', [1], voter);
            const { status } = await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                });
            expect(status).toBe(200);
            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(1);
                    expect(res.body.poll).toBeUndefined();
                    done();
                });
        });
    });
});
