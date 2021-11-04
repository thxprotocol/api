import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken } from './lib/network';
import { account, sub, userEmail2, userPassword2 } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { NetworkProvider } from '../../src/util/network';
import { getToken } from './lib/jwt';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Signup', () => {
    let poolAddress: any, dashboardAccessToken: string, testToken: Contract, adminAccessToken: string;

    beforeAll(async () => {
        testToken = await deployExampleToken();
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');

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
                    console.log(res.body);
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

    describe('GET /account/:id', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/account/' + sub)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    console.log(res.body);
                    expect(res.status).toBe(200);
                    expect(res.body.address).toBe(account.address);
                    expect(res.body.memberships[0].address).toBe(poolAddress);
                    expect(res.body.memberships[0].network).toBe(NetworkProvider.Test);
                    expect(res.body.erc20[0].address).toBe(testToken.options.address);
                    expect(res.body.erc20[0].network).toBe(NetworkProvider.Test);

                    done();
                });
        });
    });
});
