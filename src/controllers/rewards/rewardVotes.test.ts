import request from 'supertest';
import app from '@/app';
import { getProvider } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { timeTravel, signMethod, createWallet } from '@/util/jest/network';
import {
    rewardPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    proposeWithdrawPollDuration,
    tokenName,
    tokenSymbol,
    userWalletPrivateKey2,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from '@/util/jest/jwt';
import { agenda, eventNameProcessWithdrawals } from '@/util/agenda';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';

const user = request.agent(app);

describe('Voting', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalId: number,
        withdrawalDocumentId: number,
        userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();
        userWallet = createWallet(userWalletPrivateKey2);

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: {
                        name: tokenName,
                        symbol: tokenSymbol,
                        totalSupply: 0,
                    },
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);

                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });

        it('HTTP 200 (success)', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    Authorization: dashboardAccessToken,
                    AssetPool: poolAddress,
                })
                .send()
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.token.address)).toBe(true);
                })
                .expect(200, done);
        });

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302, done);
        });

        it('HTTP 302 when member is promoted', (done) => {
            user.patch(`/v1/members/${userWallet.address}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302, done);
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        it('HTTP 200', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    bypassPolls: false,
                    rewardPollDuration: rewardPollDuration,
                    proposeWithdrawPollDuration: proposeWithdrawPollDuration,
                })
                .expect(200, done);
        });

        it('HTTP 200 updated values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);
                })
                .expect(200, done);
        });

        it('HTTP 500 if incorrect rewardPollDuration type (string) sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    rewardPollDuration: 'fivehundred',
                })
                .expect(400, done);
        });

        it('HTTP 500 if incorrect proposeWithdrawPollDuration type (string) is sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    proposeWithdrawPollDuration: 'fivehundred',
                })
                .expect(400, done);
        });

        it('HTTP should still have the correct values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.bypassPolls).toEqual(false);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/', () => {
        let redirectURL = '';

        it('HTTP 302 when reward is added', (done) => {
            user.post('/v1/rewards/')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 after redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(1);
                    rewardID = res.body.id;
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/poll/vote', () => {
        it('HTTP 200 and base64 string for the yes vote', (done) => {
            user.post(`/v1/rewards/${rewardID}/poll/vote`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    agree: true,
                })
                .expect((res: request.Response) => {
                    expect(res.body.base64).toContain('data:image/png;base64');
                })
                .expect(200, done);
        });

        it('HTTP 302 when tx is handled', async () => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);

            await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                })
                .expect(200);
        });

        it('HTTP 200 and increase yesCounter with 1', (done) => {
            user.get('/v1/rewards/' + rewardID)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect((res: request.Response) => {
                    expect(Number(res.body.poll.totalVoted)).toEqual(1);
                    expect(Number(res.body.poll.yesCounter)).toEqual(1);
                    expect(Number(res.body.poll.noCounter)).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/poll/finalize (rewardPoll)', () => {
        beforeAll(async () => {
            await timeTravel(rewardPollDuration);
        });

        it('HTTP 200 after finalizing the poll', (done) => {
            user.post(`/v1/rewards/${rewardID}/poll/finalize`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.state).toBe(1);
                    expect(res.body.poll).toBeUndefined();
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 after giving a reward', (done) => {
            user.post(`/v1/rewards/${rewardID}/give`)
                .send({
                    member: userWallet.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.id).toBeDefined();

                    withdrawalDocumentId = res.body.id;
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals?member=:address', () => {
        it('should wait for queue to succeed', (done) => {
            const callback = () => {
                agenda.off(`success:${eventNameProcessWithdrawals}`, callback);
                done();
            };
            agenda.on(`success:${eventNameProcessWithdrawals}`, callback);
        });

        it('HTTP 200 and return a list of 1 item', (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                    withdrawalId = res.body.results[0].withdrawalId;
                })
                .expect(200, done);
        });
    });

    describe('POST /withdrawals/:id/vote', () => {
        it('HTTP 200 and base64 string for the yes vote', (done) => {
            user.post(`/v1/withdrawals/${withdrawalDocumentId}/vote`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    agree: true,
                })
                .expect((res: request.Response) => {
                    expect(res.body.base64).toContain('data:image/png;base64');
                })
                .expect(200, done);
        });

        it('HTTP 302 when tx is handled', async () => {
            const { admin } = getProvider(NetworkProvider.Main);
            const { call, nonce, sig } = await signMethod(poolAddress, 'withdrawPollVote', [withdrawalId, true], admin);

            await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                })
                .expect(200);
        });

        it('HTTP 200 and increase yesCounter with 1', (done) => {
            user.get('/v1/withdrawals/' + withdrawalDocumentId)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.poll.totalVoted).toEqual(1);
                    expect(res.body.poll.yesCounter).toEqual(1);
                    expect(res.body.poll.noCounter).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        beforeAll(async () => {
            await timeTravel(proposeWithdrawPollDuration);
        });

        it('HTTP 200 and 0 balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.token.balance).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 OK', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawalId],
                userWallet,
            );

            await user
                .post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect(200);
        });

        it('HTTP 200 and increased balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.token.balance).toBe(1000);
                })
                .expect(200, done);
        });
    });
});
