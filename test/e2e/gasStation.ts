import request from 'supertest';
import app from '../../src/app';
import db from '../../src/util/database';
import { voter, timeTravel, signMethod, admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardTitle,
    rewardDescription,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
} from './lib/constants';

const user = request.agent(app);

describe('Gas Station', () => {
    let poolAddress: any, pollId: any, withdrawPollAddress: any, testToken: any;

    beforeAll(async () => {
        await db.truncate();

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();

        // Create an account
        await user
            .post('/v1/signup')
            .send({ email: 'test.api.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' });

        // Login
        await user.post('/v1/login').send({ email: 'test.api.bot@thx.network', password: 'mellon' });

        // Create an asset pool
        const res = await user.post('/v1/asset_pools').send({
            title: poolTitle,
            token: testToken.address,
        });
        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        await testToken.transfer(poolAddress, rewardWithdrawAmount);

        // Configure the default poll durations
        await user
            .patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration,
                proposeWithdrawPollDuration,
            });

        // Create a reward
        await user.post('/v1/rewards/').set({ AssetPool: poolAddress }).send({
            withdrawAmount: rewardWithdrawAmount,
            withdrawDuration: rewardWithdrawDuration,
            title: rewardTitle,
            description: rewardDescription,
        });

        // Add a member
        await user.post('/v1/members').set({ AssetPool: poolAddress }).send({ address: voter.address });
    });

    describe('GET /accounts', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user.get('/v1/rewards/1').set({ AssetPool: poolAddress });
            pollId = body.poll.pollId;
            expect(body.state).toBe(0);
            done();
        });
    });

    describe('POST /gas_station/base_poll (vote)', () => {
        let redirectURL = '';

        it('HTTP 302 when call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], voter);
            const { headers, status } = await user
                .post('/v1/gas_station/base_poll')
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    redirect: `polls/${pollId}`,
                });
            expect(status).toBe(302);
            redirectURL = headers.location;
            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            const { status, body } = await user.get(redirectURL).set({ AssetPool: poolAddress });

            expect(status).toBe(200);
            expect(body.yesCounter).toBe(1);

            done();
        });
    });

    describe('POST /gas_station/base_poll (revokeVote)', () => {
        let redirectURL = '';

        it('HTTP 302 when revokeVote call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollRevokeVote', [1], voter);
            const { headers, status } = await user
                .post('/v1/gas_station/base_poll')
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    redirect: `polls/${pollId}`,
                });
            redirectURL = headers.location;
            expect(status).toBe(302);
            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.yesCounter).toBe(0);
                    done();
                });
        });
    });

    describe('POST /gas_station/base_poll (finalize)', () => {
        let redirectURL = '';

        it('HTTP 302 when vote call is ok', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], voter);
            await user
                .post('/v1/gas_station/base_poll')
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    redirect: `polls/${pollId}`,
                });
            done();
        });

        it('HTTP 302 when finalize call is ok', async (done) => {
            await timeTravel(rewardPollDuration);

            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollFinalize', [1], voter);
            const { headers, status } = await user
                .post('/v1/gas_station/base_poll')
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    redirect: 'rewards/1',
                });
            redirectURL = headers.location;
            expect(status).toBe(302);
            done();
        });

        it('HTTP 200 when redirect is ok', async (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(1);
                    done();
                });
        });
    });
});
