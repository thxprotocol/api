import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { getAdmin, NetworkProvider } from '../../src/util/network';
import { timeTravel, signMethod, createWallet } from './lib/network';
import {
    rewardPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    proposeWithdrawPollDuration,
    userWalletPrivateKey,
    tokenName,
    tokenSymbol,
} from './lib/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Voting', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalID: number,
        userWallet: Account;

    beforeAll(async () => {
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');
        userWallet = createWallet(userWalletPrivateKey);

        mockStart();
    });

    afterAll(async () => {
        await db.truncate();
        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: 0,
                    token: {
                        name: tokenName,
                        symbol: tokenSymbol,
                        totalSupply: 0,
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(isAddress(res.body.address)).toBe(true);

                    poolAddress = res.body.address;

                    done();
                });
        });

        it('HTTP 200 (success)', async (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    Authorization: dashboardAccessToken,
                    AssetPool: poolAddress,
                })
                .send()
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(isAddress(res.body.token.address)).toBe(true);

                    done();
                });
        });

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 302 when member is promoted', (done) => {
            user.patch(`/v1/members/${userWallet.address}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
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
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('HTTP 200 updated values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);

                    done();
                });
        });

        it('HTTP 500 if incorrect rewardPollDuration type (string) sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    rewardPollDuration: 'fivehundred',
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });

        it('HTTP 500 if incorrect proposeWithdrawPollDuration type (string) is sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    proposeWithdrawPollDuration: 'fivehundred',
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });

        it('HTTP should still have the correct values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toEqual(false);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);

                    done();
                });
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
                .end(async (err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 after redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.id).toEqual(1);

                    rewardID = res.body.id;

                    done();
                });
        });
    });

    describe('POST /rewards/:id/poll/vote', () => {
        it('HTTP 200 and base64 string for the yes vote', (done) => {
            user.post(`/v1/rewards/${rewardID}/poll/vote`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    agree: true,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.base64).toContain('data:image/png;base64');

                    done();
                });
        });

        it('HTTP 302 when tx is handled', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);

            user.post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 200 and increase yesCounter with 1', (done) => {
            user.get('/v1/rewards/' + rewardID)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(Number(res.body.poll.totalVoted)).toEqual(1);
                    expect(Number(res.body.poll.yesCounter)).toEqual(1);
                    expect(Number(res.body.poll.noCounter)).toEqual(0);

                    done();
                });
        });
    });

    describe('POST /rewards/:id/poll/finalize (rewardPoll)', () => {
        beforeAll(async () => {
            await timeTravel(rewardPollDuration);
        });

        it('HTTP 200 after finalizing the poll', async (done) => {
            user.post(`/v1/rewards/${rewardID}/poll/finalize`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(1);
                    expect(res.body.poll).toBeUndefined();

                    done();
                });
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 after giving a reward', async (done) => {
            user.post(`/v1/rewards/${rewardID}/give`)
                .send({
                    member: userWallet.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.withdrawal).toBe(2);

                    withdrawalID = res.body.withdrawal;

                    done();
                });
        });
    });

    describe('GET /withdrawals?member=:address', () => {
        it('HTTP 200 and return a list of 1 item', async (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.results.length).toBe(1);

                    withdrawalID = res.body.results[0].id;

                    done();
                });
        });
    });

    describe('POST /withdrawals/:id/vote', () => {
        it('HTTP 200 and base64 string for the yes vote', (done) => {
            user.post(`/v1/withdrawals/${withdrawalID}/vote`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    agree: true,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.base64).toContain('data:image/png;base64');

                    done();
                });
        });

        it('HTTP 302 when tx is handled', async (done) => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollVote',
                [withdrawalID, true],
                getAdmin(NetworkProvider.Test),
            );

            user.post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 200 and increase yesCounter with 1', (done) => {
            user.get('/v1/withdrawals/' + withdrawalID)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.poll.totalVoted).toEqual(1);
                    expect(res.body.poll.yesCounter).toEqual(1);
                    expect(res.body.poll.noCounter).toEqual(0);

                    done();
                });
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        beforeAll(async () => {
            await timeTravel(proposeWithdrawPollDuration);
        });

        it('HTTP 200 and 0 balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.token.balance).toBe(0);

                    done();
                });
        });

        it('HTTP 200 OK', async (done) => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawalID],
                userWallet,
            );

            user.post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('HTTP 200 and increased balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.token.balance).toBe(1000);

                    done();
                });
        });
    });
});
