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
    rewardWithdrawAmount,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { WithdrawalState } from '@/types/enums';
import { getRewardConfiguration } from '../rewards/utils';
import { WithdrawalDocument } from '@/models/Withdrawal';
import { AssetPoolDocument } from '@/models/AssetPool';
import { RewardDocument } from '@/models/Reward';

const user = request.agent(app);

describe('Claims', () => {
    let pool: AssetPoolDocument,
        poolId: string,
        poolAddress: string,
        reward: RewardDocument,
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
                pool = res.body;
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
                    reward = res.body;
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

            it('should return ClaimURLData', (done) => {
                user.get(`/v1/claims/${reward.claimId}`)
                    .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                    .expect((res: request.Response) => {
                        expect(res.body.rewardId.toString()).toEqual(rewardID.toString());
                        expect(res.body.poolAddress).toEqual(poolAddress);
                        expect(res.body.tokenSymbol).toEqual(tokenSymbol);
                        expect(res.body.withdrawAmount).toEqual(reward.withdrawAmount);
                        //expect(res.body[0].withdrawCondition).toEqual(reward.withdrawCondition);
                        expect(res.body.chainId).toEqual(pool.chainId);
                        expect(res.body.clientId).toEqual(pool.clientId);
                    })
                    .expect(200, done);
            });
        });
    });
});
