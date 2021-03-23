import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { admin } from '../../src/util/network';
import { voter } from './lib/network';
import { exampleTokenFactory } from './lib/network';
import { poolTitle, mintAmount, userEmail, userPassword } from './lib/constants';
import { registerClientCredentialsClient } from './lib/registerClient';

const user = request(server);

describe('Roles', () => {
    let poolAddress: any, testToken: any, adminAccessToken: string, userAddress: string;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
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
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: adminAccessToken })
                .send({
                    title: poolTitle,
                    token: {
                        address: testToken.address,
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
