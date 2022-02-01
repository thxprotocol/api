import request from 'supertest';
import server from '../../src/server';
import { NetworkProvider, sendTransaction } from '../../src/util/network';
import db from '../../src/util/database';
import { timeTravel, signMethod, createWallet, deployExampleToken } from './lib/network';
import {
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    userWalletPrivateKey,
} from './lib/constants';
import { solutionContract } from '../../src/util/network';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Gas Station', () => {
    let poolAddress: string,
        adminAccessToken: string,
        dashboardAccessToken: string,
        userAccessToken: string,
        testToken: Contract,
        userWallet: Account;

    beforeAll(async () => {
        testToken = await deployExampleToken();
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');
        userWallet = createWallet(userWalletPrivateKey);

        mockStart();
    });

    afterAll(async () => {
        await db.truncate();
        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('201 OK', async () => {
            const { body } = await user
                .post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: 0,
                    token: {
                        address: testToken.options.address,
                    },
                });

            poolAddress = body.address;
        });

        it('Deposit into pool', async () => {
            // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
            const solution = solutionContract(NetworkProvider.Test, poolAddress);
            const amount = toWei(rewardWithdrawAmount.toString());

            await sendTransaction(
                testToken.options.address,
                testToken.methods.approve(poolAddress, toWei(rewardWithdrawAmount.toString())),
                NetworkProvider.Test,
            );
            await sendTransaction(solution.options.address, solution.methods.deposit(amount), NetworkProvider.Test);
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        it('should set rewardPollDuration and proposeWithdrawPollDuration', async () => {
            // Configure the default poll durations
            await user
                .patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    bypassPolls: false,
                    rewardPollDuration,
                    proposeWithdrawPollDuration,
                });
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

        it('should have state Pending (0)', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.state).toBe(0);
                    expect(body.withdrawAmount).toBe(0);
                    expect(body.withdrawDuration).toBe(rewardWithdrawDuration);
                })
                .expect(200, done);
        });
    });

    describe('POST /members', () => {
        it('200 ok', async () => {
            // Add a member
            await user
                .post('/v1/members')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({ address: userWallet.address });
        });
    });

    describe('POST /gas_station/call (vote)', () => {
        it('HTTP 200 when call is ok', async () => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);
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

        it('HTTP 200 when redirect is ok', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.poll.yesCounter).toBe(1);
                })
                .expect(200, done);
        });
    });

    describe('POST /gas_station/base_poll (revokeVote)', () => {
        it('HTTP 200 when revokeVote call is ok', async () => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollRevokeVote', [1], userWallet);
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

        it('HTTP 200 when redirect is ok', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.poll.yesCounter).toBe(0);
                })

                .expect(200, done);
        });
    });

    describe('POST /gas_station/base_poll (finalize)', () => {
        it('HTTP 302 when vote call is ok', async () => {
            const data = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);

            await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send(data)
                .expect(200);
        });

        it('HTTP 200 when finalize call is ok', async () => {
            await timeTravel(rewardPollDuration);

            const data = await signMethod(poolAddress, 'rewardPollFinalize', [1], userWallet);

            await user
                .post('/v1/gas_station/call')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send(data)
                .expect(200);
        });

        it('HTTP 200 when redirect is ok', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.state).toBe(1);
                    expect(body.poll).toBeUndefined();
                })
                .expect(200, done);
        });
    });
});
