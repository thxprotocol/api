import request from 'supertest';
import app from '@/app';
import { Account } from 'web3-core';
import { NetworkProvider } from '../../types/enums';
import { createWallet, signMethod } from '@/util/jest/network';
import { rewardWithdrawAmount, tokenName, tokenSymbol, userWalletPrivateKey2 } from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { WithdrawalState } from '@/types/enums';
import { agenda, eventNameProcessWithdrawals, eventNameRequireWithdraws } from '@/util/agenda';

const user = request.agent(app);

describe('Reward Claim', () => {
    let adminAccessToken: string,
        redirectURL: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalDocumentId: string,
        withdrawalId: string,
        userWallet: Account;

    beforeAll(async () => {
        await beforeAllCallback();
        userWallet = createWallet(userWalletPrivateKey2);

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');
    });

    afterAll(afterAllCallback);

    it('Create Asset Pool', (done) => {
        user.post('/v1/asset_pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                network: NetworkProvider.Main,
                token: {
                    name: tokenName,
                    symbol: tokenSymbol,
                    totalSupply: 0,
                },
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201, done);
    });

    it('Create reward', (done) => {
        user.post('/v1/rewards/')
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
            .send({
                withdrawAmount: rewardWithdrawAmount,
                withdrawDuration: 0,
                isClaimOnce: false,
                isMembershipRequired: false,
            })
            .expect((res: request.Response) => {
                redirectURL = res.headers.location;
            })
            .expect(302, done);
    });

    it('Get reward ID', (done) => {
        user.get(redirectURL)
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
            .expect((res: request.Response) => {
                expect(res.body.id).toEqual(1);
                rewardID = res.body.id;
            })
            .expect(200, done);
    });

    it('Add member', (done) => {
        user.post('/v1/members/')
            .send({ address: userWallet.address })
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
            .expect(302, done);
    });

    describe('POST /rewards/:id/claim', () => {
        it('should disable job processor', async () => {
            await agenda.disable({ name: eventNameRequireWithdraws });
        });

        it('should return a 200 and withdrawal id', (done) => {
            user.post(`/v1/rewards/${rewardID}/claim`)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.id).toBeDefined();
                    expect(res.body.state).toEqual(WithdrawalState.Pending);

                    withdrawalDocumentId = res.body.id;
                })
                .expect(200, done);
        });

        it('should cast a success event for ProcessWithdrawals event', (done) => {
            const callback = async () => {
                agenda.off(`success:${eventNameProcessWithdrawals}`, callback);
                done();
            };
            agenda.on(`success:${eventNameProcessWithdrawals}`, callback);
        });

        it('should return Pending state', (done) => {
            user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
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
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                })
                .expect(200);
        });

        it('should enable job processor', async () => {
            await agenda.enable({ name: eventNameRequireWithdraws });
        });

        it('should cast a success event for Withdrawn event', (done) => {
            const callback = async () => {
                agenda.off(`success:${eventNameRequireWithdraws}`, callback);
                done();
            };
            agenda.on(`success:${eventNameRequireWithdraws}`, callback);
        });

        it('should return Withdrawn state', (done) => {
            user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect((res: request.Response) => {
                    expect(res.body.state).toEqual(WithdrawalState.Withdrawn);
                })
                .expect(200, done);
        });
    });
});
