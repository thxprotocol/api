import request from 'supertest';
import app from '@/app';
import { ERC20Type, ChainId } from '@/types/enums';
import {
    adminAccessToken,
    dashboardAccessToken,
    rewardWithdrawAmount,
    sub2,
    tokenName,
    tokenSymbol,
    userWalletPrivateKey2,
    walletAccessToken,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { createWallet } from '@/util/jest/network';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';

const user = request.agent(app);

describe('Propose Withdrawal', () => {
    let poolAddress: string, withdrawalDocumentId: number, tokenAddress: string, userWallet: Account, poolId: string;

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);
    });

    afterAll(afterAllCallback);

    describe('POST /erc20', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/erc20')
                .set('Authorization', dashboardAccessToken)
                .send({
                    chainId: ChainId.Hardhat,
                    name: tokenName,
                    symbol: tokenSymbol,
                    type: ERC20Type.Unlimited,
                    totalSupply: 0,
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    tokenAddress = body.address;
                })
                .expect(201, done);
        });
    });
    describe('POST /pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    chainId: ChainId.Hardhat,
                    tokens: [tokenAddress],
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolId = res.body._id;
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });

        it('HTTP 200 (success)', (done) => {
            user.get('/v1/pools/' + poolId)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .send()
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.token.address)).toBe(true);
                })
                .expect(200, done);
        });

        it('HTTP 200 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': adminAccessToken })
                .expect(200, done);
        });
    });

    describe('POST /withdrawals', () => {
        it('HTTP 201 after proposing a withdrawal', (done) => {
            user.post('/v1/withdrawals')
                .send({
                    member: userWallet.address,
                    amount: rewardWithdrawAmount,
                })

                .set({ 'X-PoolAddress': poolAddress, 'Authorization': adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.id).toBeDefined();
                    expect(body.sub).toEqual(sub2);
                    expect(body.amount).toEqual(rewardWithdrawAmount);
                    expect(body.state).toEqual(0);
                    expect(body.createdAt).toBeDefined();
                    expect(body.withdrawalId).toEqual(1);
                    expect(body.unlockDate).not.toBe(undefined);

                    withdrawalDocumentId = body.id;
                })
                .expect(201, done);
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        it('HTTP 200 and 0 balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.token.balance).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 OK', (done) => {
            user.post(`/v1/withdrawals/${withdrawalDocumentId}/withdraw`)
                .send()
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': adminAccessToken })
                .expect(200, done);
        });

        it('HTTP 200 and 1000 balance', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': adminAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.token.balance).toBe(1000);
                })
                .expect(200, done);
        });
    });

    describe('DELETE /withdrawals/:id', () => {
        it('HTTP 204', (done) => {
            user.delete('/v1/withdrawals/' + withdrawalDocumentId)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': walletAccessToken })
                .expect(204, done);
        });
    });

    describe('GET /pools/:address (totalSupply)', () => {
        it('HTTP 200 state OK', (done) => {
            user.get('/v1/pools/' + poolId)
                .set({ 'X-PoolAddress': poolAddress, 'Authorization': dashboardAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.token.poolBalance).toBe(0);
                    expect(res.body.token.name).toBe(tokenName);
                    expect(res.body.token.symbol).toBe(tokenSymbol);
                    expect(res.body.token.totalSupply).toBe(1025); // 1000 token reward + 25 protocol fee
                })
                .expect(200, done);
        });
    });
});
