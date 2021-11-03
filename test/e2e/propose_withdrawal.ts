import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { rewardWithdrawAmount, tokenName, tokenSymbol, userWalletPrivateKey } from './lib/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { createWallet } from './lib/network';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Propose Withdrawal', () => {
    let adminAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        withdrawalID: number,
        userWallet: Account;

    beforeAll(async () => {
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userWallet = createWallet(userWalletPrivateKey);

        mockStart();
    });

    afterAll(async () => {
        mockClear();
        await db.truncate();
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
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
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
    });

    describe('POST /withdrawals', () => {
        it('HTTP 200 after proposing a withdrawal', async (done) => {
            user.post('/v1/withdrawals')
                .send({
                    member: userWallet.address,
                    amount: rewardWithdrawAmount,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(res.body.withdrawal.id).toBe(1);

                    withdrawalID = res.body.withdrawal.id;

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
