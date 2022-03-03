import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { deployExampleToken } from '@/util/jest/network';
import { rewardWithdrawAmount, rewardWithdrawDuration } from '@/util/jest/constants';
import { solutionContract } from '@/util/network';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { TransactionService } from '@/services/TransactionService';

const user = request.agent(app);

describe('Gas Station', () => {
    let poolAddress: string, adminAccessToken: string, dashboardAccessToken: string, testToken: Contract;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = await deployExampleToken();

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('201 OK', async () => {
            const { body } = await user
                .post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: NetworkProvider.Main,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .expect(201);

            poolAddress = body.address;
        });

        it('Deposit into pool', async () => {
            // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
            const solution = solutionContract(NetworkProvider.Main, poolAddress);
            const amount = toWei(rewardWithdrawAmount.toString());

            await TransactionService.send(
                testToken.options.address,
                testToken.methods.approve(poolAddress, toWei(rewardWithdrawAmount.toString())),
                NetworkProvider.Main,
            );
            await TransactionService.send(
                solution.options.address,
                solution.methods.deposit(amount),
                NetworkProvider.Main,
            );
        });
    });

    describe('POST /rewards', () => {
        it('should ', async () => {
            await user
                .post('/v1/rewards/')
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect(302);
        });

        it('should have state Withdrawn (1)', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.state).toBe(1);
                    expect(body.withdrawAmount).toBe(rewardWithdrawAmount);
                    expect(body.withdrawDuration).toBe(rewardWithdrawDuration);
                    expect(body.poll).toBe(undefined);
                })
                .expect(200, done);
        });
    });
});
