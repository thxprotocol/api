import request from 'supertest';
import server from '../../server';
import { NetworkProvider } from '../../util/network';
import { createWallet } from '@/util/jest/network';
import {
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    tokenName,
    tokenSymbol,
    userWalletPrivateKey2,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { WithdrawalState } from '@/enums';

const user = request.agent(server);

describe('Reward Claim', () => {
    let adminAccessToken: string,
        redirectURL: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        rewardID: string,
        withdrawalId: number,
        withdrawalDocumentId: number,
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
                withdrawDuration: rewardWithdrawDuration,
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

    describe('POST /rewards/:id/claim', () => {
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

        it('should wait for job processing', () => {
            //
        });

        it('should return Pending state', (done) => {
            user.get(`/v1/withdrawals/${withdrawalDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect((res: request.Response) => {
                    console.log(res.body);
                    expect(res.body.state).toEqual(WithdrawalState.Pending);
                })
                .expect(200, done);
        });
    });
});
