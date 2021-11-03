import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { getAdmin, NetworkProvider } from '../../src/util/network';
import { createWallet, deployExampleToken, voter } from './lib/network';
import { userWalletPrivateKey } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { getToken } from './lib/jwt';
import { Account } from 'web3-core';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Roles', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        adminAccessToken: string,
        userWallet: Account;

    beforeAll(async () => {
        testToken = await deployExampleToken();
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
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: 0,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    poolAddress = res.body.address;
                    done();
                });
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            const admin = getAdmin(NetworkProvider.Test);
            user.get('/v1/members/' + admin.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + voter.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });

    describe('POST /members/:address', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 for redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.token.balance).toEqual(0);
                    done();
                });
        });
    });

    describe('PATCH /members/:address (isManager: true)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userWallet.address)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;
                    done();
                });
        });

        it('HTTP 200 and isManager true', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(res.body.token.balance).toEqual(0);
                    done();
                });
        });
    });

    describe('PATCH /members/:address (isManager: false)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userWallet.address)
                .send({ isManager: false })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;
                    done();
                });
        });

        it('HTTP 200 and isManager: false', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.token.balance).toEqual(0);
                    done();
                });
        });
    });

    describe('GET /members', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.length).toEqual(1);
                    expect(res.body[0]).toBe(userWallet.address);
                    done();
                });
        });
    });

    describe('DELETE /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.delete('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(204);
                    done();
                });
        });
    });

    describe('GET /members/:address (after DELETE)', () => {
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });

    describe('GET /members (after DELETE)', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.length).toEqual(0);
                    done();
                });
        });
    });
});
