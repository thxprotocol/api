import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken, voter } from './lib/network';
import { account, sub, userEmail2, userPassword2 } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { NetworkProvider } from '../../src/util/network';
import { getToken } from './lib/jwt';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Signup', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        adminAccessToken: string,
        walletAccessToken: string,
        membershipID: string;

    beforeAll(async () => {
        testToken = await deployExampleToken();
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        walletAccessToken = getToken('openid user');

        mockStart();
    });

    afterAll(async () => {
        await db.truncate();
        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: NetworkProvider.Test,
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

    describe('POST /account (+ membership)', () => {
        it('HTTP 201', async (done) => {
            user.post('/v1/account')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    email: userEmail2,
                    password: userPassword2,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(res.body.id).toBe(account.id);
                    expect(res.body.address).toBe(account.address);
                    done();
                });
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members/' + account.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.isMember).toBe(true);
                    done();
                });
        });
    });

    // describe('POST /gas_station/upgrade_address', () => {
    //     it('HTTP 200 if OK', (done) => {
    //         const nonce = '',
    //             call = '',
    //             sig = '';

    //         user.post('/v1/gas_station/upgrade_address')
    //             .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
    //             .send({
    //                 newAddress: '',
    //                 nonce,
    //                 call,
    //                 sig,
    //             })
    //             .end(async (err, res) => {
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });
    // });

    describe('GET /account/', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/account/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.address).toBe(account.address);

                    done();
                });
        });
    });

    describe('PATCH /account/', () => {
        it('HTTP 200 if OK', (done) => {
            user.patch('/v1/account/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .send({ address: voter.address })
                .end(async (err, res) => {
                    expect(res.status).toBe(303);
                    done();
                });
        });
    });

    describe('GET /memberships/', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/memberships/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    membershipID = res.body[0];
                    done();
                });
        });
    });

    describe('GET /memberships/:id', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/memberships/' + membershipID)
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.id).toBe(membershipID);
                    expect(res.body.poolAddress).toBe(poolAddress);
                    expect(res.body.network).toBe(NetworkProvider.Test);
                    expect(res.body.token.address).toBe(testToken.options.address);
                    expect(res.body.token.symbol).toBeDefined();
                    expect(res.body.token.name).toBeDefined();

                    done();
                });
        });
    });
});
