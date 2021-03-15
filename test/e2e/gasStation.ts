import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { voter, timeTravel, signMethod, admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
} from './lib/constants';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerAuthorizationCodeClient,
    registerClientCredentialsClient,
} from './lib/registerClient';

const user = request(server);
const http2 = request.agent(server);

describe('Gas Station', () => {
    let poolAddress: any, pollId: any, adminAccessToken: string, userAccessToken: string, testToken: any;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();

        // Create an account
        await user.post('/v1/signup').set({ Authorization: adminAccessToken }).send({
            address: voter.address,
            email: 'test.api.bot@thx.network',
            password: 'mellon',
            confirmPassword: 'mellon',
        });

        const client = await registerAuthorizationCodeClient(user);
        const headers = await getAuthHeaders(http2, client);
        const authCode = await getAuthCode(http2, headers, client, {
            email: 'test.api.bot@thx.network',
            password: 'mellon',
        });

        userAccessToken = await getAccessToken(http2, client, authCode);

        // Create an asset pool
        const res = await user.post('/v1/asset_pools').set({ Authorization: adminAccessToken }).send({
            title: poolTitle,
            token: testToken.address,
        });

        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        await testToken.transfer(poolAddress, rewardWithdrawAmount);

        // Configure the default poll durations
        await user
            .patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
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
