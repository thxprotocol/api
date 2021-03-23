import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { admin } from '../../src/util/network';
import { timeTravel, signMethod } from './lib/network';
import {
    poolTitle,
    rewardPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    userEmail,
    userPassword,
    proposeWithdrawPollDuration,
} from './lib/constants';
import { ethers, Wallet } from 'ethers';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerAuthorizationCodeClient,
    registerClientCredentialsClient,
} from './lib/registerClient';
import { decryptString } from '../../src/util/decrypt';
import { provider } from '../../src/util/network';

const user = request(server);
const http2 = request.agent(server);

describe('Voting', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalID: number,
        userAddress: string,
        userWallet: Wallet;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);
    });

    describe('POST /signup', () => {
        it('HTTP 302 if payload is correct', (done) => {
            user.post('/v1/signup')
                .set('Authorization', adminAccessToken)
                .send({ email: userEmail, password: userPassword, confirmPassword: userPassword })
                .end((err, res) => {
                    expect(res.status).toBe(201);
                    expect(ethers.utils.isAddress(res.body.address)).toBe(true);

                    userAddress = res.body.address;

                    done();
                });
        });
    });

    describe('GET /account', () => {
        beforeAll(async () => {
            const client = await registerAuthorizationCodeClient(user);
            const headers = await getAuthHeaders(http2, client);
            const authCode = await getAuthCode(http2, headers, client, {
                email: userEmail,
                password: userPassword,
            });

            userAccessToken = await getAccessToken(http2, client, authCode);
        });

        it('HTTP 200', async (done) => {
            user.get('/v1/account')
                .set({
                    Authorization: userAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBeTruthy();

                    const pKey = decryptString(res.body.privateKey, userPassword);
                    userWallet = new ethers.Wallet(pKey, provider);

                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', adminAccessToken)
                .send({
                    title: poolTitle,
                    token: {
                        name: 'SparkBlue Token',
                        symbol: 'SPARK',
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(ethers.utils.isAddress(res.body.address)).toBe(true);

                    poolAddress = res.body.address;

                    done();
                });
        });

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 302 when member is promoted', (done) => {
            user.patch(`/v1/members/${userAddress}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        it('HTTP 302 ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    bypassPolls: false,
                    rewardPollDuration: 10,
                    proposeWithdrawPollDuration: 10,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
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
        it('... pause 1s to index events', async () => {
            await new Promise((res) => setTimeout(res, 1000));
            expect(true).toBe(true);
        });

        it('HTTP 200 and return a list of 1 item', async (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.length).toBe(1);

                    withdrawalID = res.body[0].id;

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
            const { call, nonce, sig } = await signMethod(poolAddress, 'withdrawPollVote', [withdrawalID, true], admin);

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

        it('... pause 1s to index events', async () => {
            await new Promise((res) => setTimeout(res, 1000));
            expect(true).toBe(true);
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
                    expect(res.body.balance.amount).toBe(0);

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
                    expect(res.body.balance.amount).toBe(1000);

                    done();
                });
        });
    });
});
