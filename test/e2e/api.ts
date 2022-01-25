import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { callFunction, NetworkProvider, sendTransaction } from '../../src/util/network';
import { timeTravel, signMethod, deployExampleToken, createWallet } from './lib/network';
import {
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
    userWalletPrivateKey,
    adminAddress,
} from './lib/constants';
import { fromWei, toWei } from 'web3-utils';
import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { solutionContract } from '../../src/util/network';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { mockClear, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Happy Flow', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        withdrawDocumentId: string,
        withdrawPollID: string,
        userWallet: Account,
        testToken: Contract;

    beforeAll(async () => {
        testToken = await deployExampleToken();
        userWallet = createWallet(userWalletPrivateKey);
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user');

        mockStart();
    });

    afterAll(async () => {
        await db.truncate();
        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Test,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });
    });

    describe('GET /asset_pools/:address', () => {
        let balanceOfAdmin = '';

        it('Deposit assets in pool', async () => {
            const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
            const amount = toWei(rewardWithdrawAmount.toString());

            await sendTransaction(
                testToken.options.address,
                testToken.methods.approve(poolAddress, toWei(rewardWithdrawAmount.toString())),
                NetworkProvider.Test,
            );
            await sendTransaction(assetPool.options.address, assetPool.methods.deposit(amount), NetworkProvider.Test);

            balanceOfAdmin = await callFunction(testToken.methods.balanceOf(adminAddress), NetworkProvider.Test);
        });

        it('HTTP 200 and expose pool information', async () => {
            await user
                .get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .expect(async (res: request.Response) => {
                    expect(Number(fromWei(balanceOfAdmin))).toBe(Number(fromWei(mintAmount)) - rewardWithdrawAmount);
                    expect(res.body.address).toEqual(poolAddress);
                    expect(res.body.token.address).toEqual(testToken.options.address);
                    expect(res.body.token.name).toEqual(await testToken.methods.name().call());
                    // expect(res.body.token.symbol).toEqual(await testToken.methods.symbol().call());
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(0);
                    expect(Number(res.body.rewardPollDuration)).toEqual(0);
                })
                .expect(200);
        });
    });

    describe('POST /rewards/', () => {
        let redirectURL = '';

        it('HTTP 302 when reward is added', (done) => {
            user.post('/v1/rewards/')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .expect(async (res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 after redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.id).toEqual(1);
                    expect(res.body.poll).toBeUndefined();
                })
                .expect(200, done);
        });
    });

    describe('GET /rewards/:id', () => {
        it('HTTP 200 when successful', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(200, done);
        });

        it('HTTP 404 if reward can not be found', (done) => {
            user.get('/v1/rewards/2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(404, done);
        });

        it('HTTP 400 if the id parameter is invalid', (done) => {
            user.get('/v1/rewards/id_invalid')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(400, done);
        });
    });

    describe('POST /members/:address', () => {
        let redirectURL = '';

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 302 when member is added', (done) => {
            user.patch(`/v1/members/${userWallet.address}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 for the redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(res.body.token.balance).toEqual(0);
                })
                .expect(200, done);
        });
    });

    describe('GET /rewards/:id (after finalizing)', () => {
        it('HTTP 200 and return updated withdrawAmount and state 1', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.poll).toBeUndefined();
                    expect(res.body.state).toEqual(1);
                    expect(res.body.withdrawAmount).toEqual(rewardWithdrawAmount);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/claim', () => {
        it('HTTP 302 when tx is handled', async () => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'claimReward', [1], userWallet);
            await user
                .post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect(200);
        });

        it('HTTP 200 after return state Pending', (done) => {
            user.get('/v1/withdrawals?member=' + userWallet.address + '&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    const index = res.body.results.length - 1;
                    const withdrawal = res.body.results[index];
                    expect(withdrawal.approved).toEqual(true);
                    expect(withdrawal.state).toEqual(0);
                    expect(withdrawal.amount).toEqual(rewardWithdrawAmount);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 when tx is handled', (done) => {
            user.post('/v1/rewards/1/give')
                .send({
                    member: userWallet.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.status).toBe(200);
                    expect(res.body.id).toBeDefined();
                    expect(res.body.job).toBeDefined();
                    expect(res.body.beneficiary).toEqual(userWallet.address);
                    expect(res.body.amount).toEqual(rewardWithdrawAmount);
                    expect(res.body.state).toEqual(0);
                    expect(res.body.createdAt).toBeDefined();
                    expect(res.body.updatedAt).toBeDefined();
                    expect(res.body.withdrawalId).toBeUndefined();

                    withdrawDocumentId = res.body.id;
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals/:id', () => {
        beforeAll(async () => {
            await new Promise((r) => setTimeout(r, 5000));
        });

        it('HTTP 200 and return state Approved', (done) => {
            user.get(`/v1/withdrawals/${withdrawDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.status).toBe(200);
                    expect(res.body.id).toBeDefined();
                    expect(res.body.job).toBeUndefined();
                    expect(res.body.amount).toEqual(rewardWithdrawAmount);
                    expect(res.body.beneficiary).toEqual(userWallet.address);
                    expect(res.body.approved).toEqual(true);
                    expect(res.body.withdrawalId).toEqual(3);

                    withdrawPollID = res.body.withdrawalId;
                })
                .expect(200, done);
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        beforeAll(async () => {
            await timeTravel(rewardWithdrawDuration);
        });

        it('HTTP 302 and redirect to withdrawal', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawPollID],
                userWallet,
            );

            await user
                .post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect(200);
        });

        it('HTTP 200 and have the minted amount balance again', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);
                })
                .expect(200, done);
        });
    });

    describe('GET /asset_pools/:address (after withdaw)', () => {
        it('HTTP 200 and have 0 balance', (done) => {
            user.get(`/v1/asset_pools/${poolAddress}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.token.balance).toBe(0);
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals (before proposed withdrawal)', () => {
        it('HTTP 200 and returns 2 items', (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(2);
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals for withdrawn state', () => {
        it('HTTP 200 and returns 1 items', (done) => {
            user.get('/v1/withdrawals?state=1&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 2 item for state = 0', (done) => {
            user.get('/v1/withdrawals?state=0&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 0 items for state = 0 and rewardId = 1 since rewardId is unknown for claimed rewards.', (done) => {
            user.get('/v1/withdrawals?state=0&rewardId=1&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 1 item for state = 1 and rewardId = 1', (done) => {
            user.get('/v1/withdrawals?state=1&rewardId=1&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 1 item state = 1 and rewardId = 1 and member address', (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&state=1&rewardId=1&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 0 items for unknown rewardId', (done) => {
            user.get('/v1/withdrawals?state=1&rewardId=2&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 2 items for page=1 and limit=2', (done) => {
            user.get('/v1/withdrawals?page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(2);
                    expect(res.body.previous).toBeUndefined();
                })
                .expect(200, done);
        });
    });

    // Describe flow for rejected withdraw poll
    // Describe flow for rejected reward poll
});
