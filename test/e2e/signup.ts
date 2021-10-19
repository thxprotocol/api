import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken } from './lib/network';
import { account, sub, userEmail2, userPassword2 } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { NetworkProvider } from '../../src/util/network';
import { getToken } from './lib/jwt';
import { mockClear, mockPath, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Signup', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        userAccessToken: string,
        adminAccessToken: string,
        userAddress: string;

    beforeAll(async () => {
        testToken = await deployExampleToken();
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');

        mockStart();
        mockPath('post', '/account', 200, function () {
            if (poolAddress) {
                account.memberships[0] = poolAddress;
                account.erc20[0] = { network: NetworkProvider.Test, address: testToken.options.address };
            }
            return account;
        });
        mockPath('get', `/account/${sub}`, 200, function () {
            if (poolAddress) {
                account.memberships[0] = poolAddress;
                account.erc20[0] = { network: NetworkProvider.Test, address: testToken.options.address };
            }
            return account;
        });
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
                    userAddress = res.body.address;
                    done();
                });
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members/' + userAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
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

    describe('GET /account', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/account')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.memberships[0]).toBe(poolAddress);
                    expect(res.body.erc20[0].network).toBe(NetworkProvider.Test);
                    expect(res.body.erc20[0].address).toBe(testToken.options.address);

                    done();
                });
        });
    });
});
