import request from 'supertest';
import app from '@/app';
import { getProvider } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { createWallet, voter } from '@/util/jest/network';
import { userWalletPrivateKey2 } from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { getToken } from '@/util/jest/jwt';
import { Account } from 'web3-core';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContract } from '@/config/contracts';

const user = request.agent(app);

describe('Roles', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        adminAccessToken: string,
        userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(NetworkProvider.Main, 'LimitedSupplyToken');
        userWallet = createWallet(userWalletPrivateKey2);

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
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

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            const { admin } = getProvider(NetworkProvider.Main);
            user.get('/v1/members/' + admin.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(200, done);
        });
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + voter.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(404, done);
        });
    });

    describe('POST /members/:address', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 for redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.token.balance).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('PATCH /members/:address (isManager: true)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userWallet.address)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 and isManager true', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(res.body.token.balance).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('PATCH /members/:address (isManager: false)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userWallet.address)
                .send({ isManager: false })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 and isManager: false', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.token.balance).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('GET /members', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.length).toEqual(1);
                    expect(res.body[0]).toBe(userWallet.address);
                })
                .expect(200, done);
        });
    });

    describe('DELETE /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.delete('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(204, done);
        });
    });

    describe('GET /members/:address (after DELETE)', () => {
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(404, done);
        });
    });

    describe('GET /members (after DELETE)', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.length).toEqual(0);
                })
                .expect(200, done);
        });
    });
});
