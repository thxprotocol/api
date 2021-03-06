import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { getAdmin, NetworkProvider } from '../../src/util/network';
import { deployExampleToken, voter } from './lib/network';
import { poolTitle, userEmail, userPassword } from './lib/constants';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerClientCredentialsClient,
    registerDashboardClient,
} from './lib/registerClient';
import { Contract } from 'web3-eth-contract';

const user = request(server);
const http3 = request.agent(server);

describe('Roles', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        adminAccessToken: string,
        adminAudience: string,
        userAddress: string;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);

        adminAccessToken = credentials.accessToken;
        adminAudience = credentials.aud;

        testToken = await deployExampleToken();
    });

    describe('POST /signup', () => {
        it('HTTP 201 if OK', (done) => {
            user.post('/v1/signup')
                .set({ Authorization: adminAccessToken })
                .send({ email: userEmail, password: userPassword, confirmPassword: userPassword })
                .end((err, res) => {
                    expect(res.status).toBe(201);
                    done();
                });
            user.post('/v1/signup')
                .set({ Authorization: adminAccessToken })
                .send({ email: 'test.api.bot2@thx.network', password: userPassword, confirmPassword: userPassword })
                .end((err, res) => {
                    userAddress = res.body.address;
                    expect(res.status).toBe(201);
                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        beforeAll(async () => {
            const dashboardClient = await registerDashboardClient(user);
            const dashboardHeaders = await getAuthHeaders(http3, dashboardClient, 'openid dashboard');
            const dashboardAuthCode = await getAuthCode(http3, dashboardHeaders, dashboardClient, {
                email: userEmail,
                password: userPassword,
            });

            dashboardAccessToken = await getAccessToken(http3, dashboardClient, dashboardAuthCode);
        });
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    title: poolTitle,
                    aud: adminAudience,
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
                .send({ address: userAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;

                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 for redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.balance.amount).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('PATCH /members/:address (isManager: true)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userAddress)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 and isManager true', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(res.body.balance.amount).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('PATCH /members/:address (isManager: false)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userAddress)
                .send({ isManager: false })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 and isManager: false', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.balance.amount).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('DELETE /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.delete('/v1/members/' + userAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(204);
                    done();
                });
        });
    });

    describe('GET /members/:address (after DELETE)', () => {
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + userAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });
});
