import request from 'supertest';
import app from '@/app';
import { account2, userEmail2, userPassword2 } from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { NetworkProvider } from '@/types/enums';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContract } from '@/config/contracts';

const user = request.agent(app);

describe('Account', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        adminAccessToken: string,
        walletAccessToken: string,
        membershipID: string,
        userWalletAddress: string;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(NetworkProvider.Main, 'TokenLimitedSupply');

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        walletAccessToken = getToken('openid user');
    });

    afterAll(afterAllCallback);

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

    describe('POST /account', () => {
        it('HTTP 201', (done) => {
            user.post('/v1/account')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    email: userEmail2,
                    password: userPassword2,
                })
                .expect((res: request.Response) => {
                    expect(res.body.id).toBe(account2.id);
                    expect(res.body.address).toBe(account2.address);

                    userWalletAddress = res.body.address;
                })
                .expect(201, done);
        });
    });

    describe('POST /members/:address', () => {
        it('HTTP 302 if OK', (done) => {
            user.post('/v1/members/')
                .send({ address: userWalletAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })

                .expect(302, done);
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members/' + userWalletAddress)
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
                    expect(res.body.address).toBe(account2.address);
                })
                .expect(200, done);
        });
    });

    describe('PATCH /account/', () => {
        it('HTTP 200 if OK', (done) => {
            user.patch('/v1/account/')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .send({ address: account2.address })
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
