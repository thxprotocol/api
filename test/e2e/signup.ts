import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken, voter } from './lib/network';
import { account, userEmail2, userPassword2 } from './lib/constants';
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
        it('HTTP 200', (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: NetworkProvider.Main,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .expect((res: request.Response) => {
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });
    });

    describe('POST /account (+ membership)', () => {
        it('HTTP 201', (done) => {
            user.post('/v1/account')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    email: userEmail2,
                    password: userPassword2,
                })
                .expect((res: request.Response) => {
                    expect(res.body.id).toBe(account.id);
                    expect(res.body.address).toBe(account.address);
                })
                .expect(201, done);
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members/' + account.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.isMember).toBe(true);
                })
                .expect(200, done);
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
    //             .expect(200, done);
    //     });
    // });

    describe('GET /account/', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/account/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.address).toBe(account.address);
                })
                .expect(200, done);
        });
    });

    describe('PATCH /account/', () => {
        it('HTTP 200 if OK', (done) => {
            user.patch('/v1/account/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .send({ address: voter.address })
                .expect(303, done);
        });
    });

    describe('GET /memberships/', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/memberships/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect((res: request.Response) => {
                    membershipID = res.body[0];
                })
                .expect(200, done);
        });
    });

    describe('GET /memberships/:id', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/memberships/' + membershipID)
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.id).toBe(membershipID);
                    expect(res.body.poolAddress).toBe(poolAddress);
                    expect(res.body.network).toBe(NetworkProvider.Main);
                    expect(res.body.token.address).toBe(testToken.options.address);
                    expect(res.body.token.symbol).toBeDefined();
                    expect(res.body.token.name).toBeDefined();
                })
                .expect(200, done);
        });
    });
});
