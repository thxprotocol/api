import request, { Response } from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { Job } from 'agenda';
import {
    exceedingFeeData,
    feeData,
    rewardWithdrawAmount,
    tokenName,
    tokenSymbol,
    userWalletPrivateKey,
} from './lib/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { createWallet, voter } from './lib/network';
import { mockClear, mockStart, mockUrl } from './lib/mock';
import { agenda, eventNameProcessWithdrawals } from '../../src/util/agenda';
import { ERROR_MAX_FEE_PER_GAS } from '../../src/util/network';

const user = request.agent(server);

describe('Transaction Queue', () => {
    let adminAccessToken: string,
        dashboardAccessToken: string,
        walletAccessToken: string,
        poolAddress: string,
        userWallet: Account;

    beforeAll(async () => {
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        walletAccessToken = getToken('openid user');
        userWallet = createWallet(userWalletPrivateKey);

        mockStart();
    });

    afterAll(async () => {
        await agenda.stop();
        await agenda.close();
        await db.truncate();

        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async () => {
            await user
                .post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: 1,
                    token: {
                        name: tokenName,
                        symbol: tokenSymbol,
                        totalSupply: 0,
                    },
                })
                .expect(async ({ body }: Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    poolAddress = body.address;
                })
                .expect(201);
        });

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302, done);
        });
    });

    describe('POST /withdrawals 5x (gasPrice < MAXIMUM_GAS_PRICE)', () => {
        const withdrawalDocumentIdList: any = [];

        it('should disable job processor', async () => {
            await agenda.disable({ name: eventNameProcessWithdrawals });
        });

        it('should propose 5 withdrawals', async () => {
            for (let index = 0; index < 5; index++) {
                await user
                    .post('/v1/withdrawals')
                    .send({
                        member: userWallet.address,
                        amount: rewardWithdrawAmount,
                    })
                    .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                    .expect(({ body }: Response) => {
                        expect(body.type).toEqual(2);
                        expect(body.withdrawalId).toBeUndefined();

                        withdrawalDocumentIdList[index] = body.id;
                    })
                    .expect(201);
            }
        });

        it('should see 5 proposed withdrawals', async () => {
            await user
                .get('/v1/withdrawals?page=1&limit=10')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.results.length).toEqual(5);
                    expect(body.total).toEqual(5);

                    const newestFirstList = withdrawalDocumentIdList.reverse();

                    for (const index in body.results) {
                        const result = body.results[index];
                        expect(result.id).toEqual(newestFirstList[index]);
                    }
                })
                .expect(200);
        });
    });

    describe('POST /withdrawals 1x (gasPrice > MAXIMUM_GAS_PRICE)', () => {
        it('should mock exceeding gas price', async () => {
            mockClear();
            mockUrl('get', 'https://gasstation-mainnet.matic.network', '/v2', 200, exceedingFeeData);
            mockStart();
        });

        it('should propose 1 withdrawal for member', async () => {
            await user
                .post('/v1/withdrawals')
                .send({
                    member: userWallet.address,
                    amount: rewardWithdrawAmount,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.type).toEqual(2);
                    expect(body.withdrawalId).toBeUndefined();
                })
                .expect(201);
        });

        it('should enable job processor', async () => {
            await agenda.enable({ name: eventNameProcessWithdrawals });
        });

        it('should cast a fail event', (done) => {
            const callback = async (error: Error, job: Job) => {
                agenda.off(`fail:${eventNameProcessWithdrawals}`, callback);
                expect(error.message).toBe(ERROR_MAX_FEE_PER_GAS);
                done();
            };
            agenda.on(`fail:${eventNameProcessWithdrawals}`, callback);
            agenda.now(eventNameProcessWithdrawals, null);
        });

        it('should remove exceeding gas price mock', async () => {
            mockClear();
            mockStart();
        });

        it('should cast a success event', (done) => {
            const callback = () => {
                agenda.off(`success:${eventNameProcessWithdrawals}`, callback);
                done();
            };
            agenda.on(`success:${eventNameProcessWithdrawals}`, callback);
            agenda.now(eventNameProcessWithdrawals, null);
        });
    });

    describe('POST /withdrawals 1x (failReason)', () => {
        let withdrawalDocumentId = '';

        it('should disable job processor', async () => {
            await agenda.disable({ name: eventNameProcessWithdrawals });
        });

        it('should propose 1 withdrawal for unknown member', async () => {
            await user
                .post('/v1/withdrawals')
                .send({
                    member: voter.address,
                    amount: rewardWithdrawAmount,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.type).toEqual(2);
                    expect(body.withdrawalId).toBeUndefined();

                    withdrawalDocumentId = body.id;
                })
                .expect(201);
        });

        it('should enable job processor', async () => {
            await agenda.enable({ name: eventNameProcessWithdrawals });
        });

        // Even though the witdrawal fails the job doesn't. This allows other transactions to
        // be processed immediately instead of during the following job execution.
        it('should cast a success event', (done) => {
            const callback = async () => {
                agenda.off(`success:${eventNameProcessWithdrawals}`, callback);
                done();
            };
            agenda.on(`success:${eventNameProcessWithdrawals}`, callback);
            agenda.now(eventNameProcessWithdrawals, null);
        });

        it('should see a withdrawal with failReason', async () => {
            await user
                .get(`/v1/withdrawals/${withdrawalDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(withdrawalDocumentId);
                    expect(body.failReason).not.toBe('');
                })
                .expect(200);
        });
    });
});
