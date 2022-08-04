import request from 'supertest';
import app from '@/app';
import { getProvider } from '@/util/network';
import { createWallet, voter } from '@/util/jest/network';
import { adminAccessToken, dashboardAccessToken, userWalletPrivateKey2 } from '@/util/jest/constants';
import { Contract } from 'web3-eth-contract';
import { Account } from 'web3-core';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContract } from '@/config/contracts';
import { ChainId } from '@/types/enums';

const user = request.agent(app);

describe('Members', () => {
    let poolId: string, testToken: Contract, userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(ChainId.Hardhat, 'LimitedSupplyToken');
        userWallet = createWallet(userWalletPrivateKey2);
    });

    afterAll(afterAllCallback);

    describe('POST /pools', () => {
        it('HTTP 200', (done) => {
            user.post('/v1/pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    chainId: ChainId.Hardhat,
                    tokens: [testToken.options.address],
                })
                .expect((res: request.Response) => {
                    poolId = res.body._id;
                })
                .expect(201, done);
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            const { defaultAccount } = getProvider(ChainId.Hardhat);
            user.get('/v1/members/' + defaultAccount)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect(200, done);
        });
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + voter.address)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect(404, done);
        });
    });

    describe('POST /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect(200, done);
        });
    });

    describe('PATCH /members/:address (isManager: true)', () => {
        let redirectURL = '';

        it('HTTP 302 if OK', (done) => {
            user.patch('/v1/members/' + userWallet.address)
                .send({ isManager: true })
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 and isManager true', (done) => {
            user.get(redirectURL)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
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
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 and isManager: false', (done) => {
            user.get(redirectURL)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
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
            user.get('/v1/members?page=1&limit=10')
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.results.length).toEqual(1);
                    expect(res.body.results[0].address).toBe(userWallet.address);
                })
                .expect(200, done);
        });
    });

    describe('DELETE /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.delete('/v1/members/' + userWallet.address)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect(204, done);
        });
    });

    describe('GET /members/:address (after DELETE)', () => {
        it('HTTP 404 if not found', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect(404, done);
        });
    });

    describe('GET /members (after DELETE)', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members?page=1&limit=10')
                .set({ 'X-PoolId': poolId, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.results.length).toEqual(0);
                })
                .expect(200, done);
        });
    });
});
