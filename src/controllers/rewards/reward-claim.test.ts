import request from 'supertest';
import app from '@/app';
import { Account } from 'web3-core';
import { ChainId, ERC20Type } from '../../types/enums';
import { createWallet, signMethod } from '@/util/jest/network';
import {
    dashboardAccessToken,
    tokenName,
    tokenSymbol,
    walletAccessToken,
    walletAccessToken2,
    userWalletPrivateKey2,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { WithdrawalState } from '@/types/enums';
import { getRewardConfiguration } from './utils';

const user = request.agent(app);

describe('Reward Claim', () => {
    let poolId: string,
        poolAddress: string,
        rewardID: string,
        withdrawalDocumentId: string,
        withdrawalId: string,
        userWallet: Account,
        tokenAddress: string,
        hash: string;

    beforeAll(async () => {
        await beforeAllCallback();
        userWallet = createWallet(userWalletPrivateKey2);
    });

    afterAll(afterAllCallback);

    it('Create ERC20', (done) => {
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

    it('Create Asset Pool', (done) => {
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
                hash = Buffer.from(JSON.stringify({ poolAddress })).toString('base64');
            })
            .expect(201, done);
    });

    describe('A reward with limit is 0 (unlimited) and claim_one disabled', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('no-limit-and-claim-one-disabled'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(1);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });

            it('should return a 200 for this second claim', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .send({ hash })
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect(200, done);
            });
        });
    });

    describe('A reward with limit is 1 and claim_once disabled', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('one-limit-and-claim-one-disabled'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(2);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .send({ hash })
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });

            it('should return a 403 for this second claim', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .send({ hash })
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect(403, done);
            });
        });
    });

    describe('A token reward with the unlock date of today', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('withdraw-date-is-today'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(3);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });
        });
    });

    describe('A token reward with the unlock date of tomorrow', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('withdraw-date-is-tomorrow'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(4);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });
        });
    });

    describe('A token reward with an expiration date set to t plus 30 minute', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('expiration-date-is-next-30-min'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(5);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });
        });
    });

    describe('A token reward with an expiration date set to t minus 30 minute', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('expiration-date-is-previous-30-min'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(6);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 403 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect(403, done);
            });
        });
    });

    describe('A token reward with "membership required"', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('membership-is-required'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(7);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 403 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken2 })
                    .send({ hash })
                    .expect(403, done);
            });
        });
    });

    describe('A token reward with claim once enabled', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('claim-one-is-enabled'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(8);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });

            it('should return a 403 for this second claim', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect(403, done);
            });
        });
    });

    describe('A token reward with claim once disabled', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('claim-one-is-disabled'))
                .expect((res: request.Response) => {
                    expect(res.body.id).toEqual(9);
                    expect(res.body.claimId).toBeDefined();
                    rewardID = res.body.id;
                })
                .expect(201, done);
        });

        describe('POST /rewards/:id/claim', () => {
            it('should return a 200 and withdrawal id', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect((res: request.Response) => {
                        expect(res.body._id).toBeDefined();
                        expect(res.body.state).toEqual(WithdrawalState.Pending);

                        withdrawalDocumentId = res.body._id;
                    })
                    .expect(200, done);
            });

            it('should return Pending state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Pending);
                        expect(res.body.withdrawalId).toBeDefined();

                        withdrawalId = res.body.withdrawalId;
                    })
                    .expect(200, done);
            });

            it('should finalize the withdraw poll', async () => {
                const { call, nonce, sig } = await signMethod(
                    poolAddress,
                    'withdrawPollFinalize',
                    [withdrawalId],
                    userWallet,
                );

                await user
                    .post('/v1/relay/call')
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({
                        call,
                        nonce,
                        sig,
                    })
                    .expect(200);
            });

            it('should return Withdrawn state', (done) => {
                user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                    })
                    .expect(200, done);
            });

            it('should return a 200 for this second claim', (done) => {
                user.post(`/v1/rewards/${rewardID}/claim`)
                    .set({ 'X-PoolId': poolId, 'Authorization': walletAccessToken })
                    .send({ hash })
                    .expect(200, done);
            });
        });
    });
});
