import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import {
    rewardWithdrawAmount,
    userEmail,
    userPassword,
    tokenName,
    tokenSymbol,
    userEmail2,
    userPassword2,
} from './lib/constants';
import { ethers } from 'ethers';
import { Account } from 'web3-core';
import { signupWithAddress } from './lib/network';
import { getAuthCodeToken } from './lib/authorizationCode';
import { getClientCredentialsToken } from './lib/clientCredentials';

const admin = request(server);
const user = request.agent(server);
const user2 = request.agent(server);

describe('UnlimitedSupplyToken', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalID: number,
        userAddress: string,
        userWallet: Account;

    beforeAll(async () => {
        await db.truncate();

        const { accessToken } = await getClientCredentialsToken(admin);
        adminAccessToken = accessToken;

        userWallet = await signupWithAddress(userEmail, userPassword);
        userAccessToken = await getAuthCodeToken(user, 'openid user', userEmail, userPassword);
        userAddress = userWallet.address;

        await signupWithAddress(userEmail2, userPassword2);
        dashboardAccessToken = await getAuthCodeToken(user2, 'openid dashboard', userEmail2, userPassword2);
    });

    describe('GET /account', () => {
        it('HTTP 200', async (done) => {
            user.get('/v1/account')
                .set({
                    Authorization: userAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBeUndefined();
                    done();
                });
        });
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
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    bypassPolls: true,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('GET /asset_pools/:address', () => {
        it('HTTP 302 ', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toBe(true);
                    expect(res.body.token.name).toBe(tokenName);
                    expect(res.body.token.symbol).toBe(tokenSymbol);
                    expect(res.body.token.balance).toBe(0);
                    expect(res.body.token.totalSupply).toBe(0);
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
                    withdrawDuration: 0,
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
                    expect(res.body.state).toBe(1);
                    expect(res.body.poll).toBeUndefined();

                    rewardID = res.body.id;

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

    describe('POST /withdrawals/:id/withdraw', () => {
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
            user.post(`/v1/withdrawals/${withdrawalID}/withdraw`)
                .send()
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('HTTP 200 and 1000 balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.token.balance).toBe(1000);

                    done();
                });
        });
    });

    describe('GET /asset_pools/:address (totalSupply)', () => {
        it('HTTP 200 state OK', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toBe(true);
                    expect(res.body.token.name).toBe(tokenName);
                    expect(res.body.token.symbol).toBe(tokenSymbol);
                    expect(res.body.token.balance).toBe(0);
                    expect(res.body.token.totalSupply).toBe(1000);
                    done();
                });
        });
    });
});
