import request from 'supertest';
import server from '../../src/server';
import { NetworkProvider, sendTransaction } from '../../src/util/network';
import db from '../../src/util/database';
import { timeTravel, signMethod, deployExampleToken, signupWithAddress } from './lib/network';
import {
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    userEmail,
    userPassword,
    userEmail2,
    userPassword2,
} from './lib/constants';
import { solutionContract } from '../../src/util/network';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getAuthCodeToken } from './lib/authorizationCode';
import { getClientCredentialsToken } from './lib/clientCredentials';
import { Account } from 'web3-core';

const admin = request(server);
const user = request.agent(server);
const user2 = request.agent(server);

describe('Gas Station', () => {
    let poolAddress: string,
        adminAccessToken: string,
        dashboardAccessToken: string,
        userAccessToken: string,
        testToken: Contract,
        userWallet: Account;

    beforeAll(async () => {
        await db.truncate();

        const { accessToken } = await getClientCredentialsToken(admin);
        adminAccessToken = accessToken;

        userWallet = await signupWithAddress(userEmail, userPassword);
        userAccessToken = await getAuthCodeToken(user, 'openid user', userEmail, userPassword);

        await signupWithAddress(userEmail2, userPassword2);
        dashboardAccessToken = await getAuthCodeToken(user2, 'openid dashboard', userEmail2, userPassword2);

        testToken = await deployExampleToken();

        // Create an asset pool
        const res = await user
            .post('/v1/asset_pools')
            .set({ Authorization: dashboardAccessToken })
            .send({
                network: 0,
                token: {
                    address: testToken.options.address,
                },
            });

        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
        const amount = toWei(rewardWithdrawAmount.toString());

        await sendTransaction(
            testToken.options.address,
            testToken.methods.approve(poolAddress, toWei(rewardWithdrawAmount.toString())),
            NetworkProvider.Test,
        );
        await sendTransaction(assetPool.options.address, assetPool.methods.deposit(amount), NetworkProvider.Test);

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
            .send({ address: userWallet.address });
    });

    describe('GET /reward', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user
                .get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken });
            expect(status).toBe(200);
            expect(body.state).toBe(0);
            done();
        });
    });

    describe('POST /gas_station/call (vote)', () => {
        it('HTTP 302 when call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);
            const { body, status } = await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                });
            console.log(body);
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
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollRevokeVote', [1], userWallet);
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
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);
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

            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollFinalize', [1], userWallet);
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
