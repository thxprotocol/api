import request, { Response } from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { Job } from 'agenda';
import { rewardWithdrawAmount, tokenName, tokenSymbol, userWalletPrivateKey } from './lib/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { createWallet, voter } from './lib/network';
import { mockClear, mockStart, mockUrl } from './lib/mock';
import { agenda } from '../../src/util/agenda';
import { MAXIMUM_GAS_PRICE } from '../../src/util/secrets';
import WithdrawalService from '../../src/services/WithdrawalService';

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
                    network: 0,
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

        it('HTTP 302 when member is added', async () => {
            await user
                .post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302);
        });
    });

    describe('POST /withdrawals 5x (gasPrice < MAXIMUM_GAS_PRICE)', () => {
        let withdrawalDocumentIdList: any = [];

        it('should disable job processor', async () => {
            await agenda.disable({ name: 'processWithdrawals' });
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
            mockStart();
            mockUrl('get', 'https://gpoly.blockscan.com', '/gasapi.ashx?apikey=key&method=gasoracle', 200, {
                result: { FastGasPrice: (MAXIMUM_GAS_PRICE + 1).toString() },
            });
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
            await agenda.enable({ name: 'processWithdrawals' });
        });

        it('should cast a fail event', (done) => {
            const callback = async (error: Error, job: Job) => {
                agenda.off('fail:processWithdrawals', callback);

                const { withdrawal } = await WithdrawalService.getById(job.attrs.data.currentWithdrawalDocument);

                expect(withdrawal).toBeDefined();
                expect(withdrawal.withdrawalId).toBeUndefined();
                expect(withdrawal.failReason).toBeUndefined();

                done();
            };
            agenda.on('fail:processWithdrawals', callback);
        });

        it('should remove exceeding gas price mock', async () => {
            mockClear();
            mockStart();
            mockUrl('get', 'https://gpoly.blockscan.com', '/gasapi.ashx?apikey=key&method=gasoracle', 200, {
                result: { FastGasPrice: (MAXIMUM_GAS_PRICE - 1).toString() },
            });
        });

        it('should cast a success event', (done) => {
            const callback = () => {
                agenda.off('success:processWithdrawals', callback);
                done();
            };
            agenda.on('success:processWithdrawals', callback);
        });
    });

    describe('POST /withdrawals 1x (failReason)', () => {
        let withdrawalDocumentId = '',
            failReason = '';

        it('should disable job processor', async () => {
            await agenda.disable({ name: 'processWithdrawals' });
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
            await agenda.enable({ name: 'processWithdrawals' });
        });

        it('should cast a fail event', (done) => {
            const callback = async (error: Error, job: Job) => {
                failReason = job.attrs.failReason;
                const currentWithdrawalDocument = job.attrs.data.currentWithdrawalDocument;
                expect(currentWithdrawalDocument).toEqual(withdrawalDocumentId);
                agenda.off('fail:processWithdrawals', callback);
                done();
            };

            agenda.on('fail:processWithdrawals', callback);
        });

        it('wait 1s to let the event callback update the withdrawal with failReason', async () => {
            await new Promise((r) => setTimeout(r, 1000));
        });

        it('should see a withdrawal with failReason', async () => {
            await user
                .get(`/v1/withdrawals/${withdrawalDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.id).toEqual(withdrawalDocumentId);
                    expect(body.failReason).toEqual(failReason);
                })
                .expect(200);
        });
    });
});
