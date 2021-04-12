import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { getAdmin, getProvider, NetworkProvider } from '../../src/util/network';
import { timeTravel, signMethod } from './lib/network';
import { exampleTokenFactory } from './lib/network';
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
    userEmail,
    userPassword,
} from './lib/constants';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { Contract, ethers, Wallet } from 'ethers';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerWalletClient,
    registerDashboardClient,
    registerClientCredentialsClient,
} from './lib/registerClient';
import { decryptString } from '../../src/util/decrypt';
import { solutionContract } from '../../src/util/network';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Happy Flow', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        adminAudience: string,
        poolAddress: string,
        userAddress: string,
        withdrawPollID: string,
        userWallet: Wallet,
        testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);
        const admin = getAdmin(NetworkProvider.Test);

        adminAccessToken = credentials.accessToken;
        adminAudience = credentials.aud;

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe('POST /signup', () => {
        it('HTTP 302 if payload is correct', (done) => {
            user.post('/v1/signup')
                .set('Authorization', adminAccessToken)
                .send({ email: userEmail, password: userPassword, confirmPassword: userPassword })
                .end((err, res) => {
                    userAddress = res.body.address;
                    expect(ethers.utils.isAddress(res.body.address)).toBe(true);
                    expect(res.status).toBe(201);
                    done();
                });
        });
    });

    describe('GET /account', () => {
        beforeAll(async () => {
            const walletClient = await registerWalletClient(user);
            const walletHeaders = await getAuthHeaders(http2, walletClient, 'openid user email offline_access');
            const walletAuthCode = await getAuthCode(http2, walletHeaders, walletClient, {
                email: userEmail,
                password: userPassword,
            });

            const dashboardClient = await registerDashboardClient(user);
            const dashboardHeaders = await getAuthHeaders(http3, dashboardClient, 'openid dashboard');
            const dashboardAuthCode = await getAuthCode(http3, dashboardHeaders, dashboardClient, {
                email: userEmail,
                password: userPassword,
            });

            userAccessToken = await getAccessToken(http2, walletClient, walletAuthCode);
            dashboardAccessToken = await getAccessToken(http3, dashboardClient, dashboardAuthCode);
        });

        it('HTTP 200', async (done) => {
            user.get('/v1/account')
                .set({
                    Authorization: userAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBeTruthy();
                    const pKey = decryptString(res.body.privateKey, userPassword);
                    userWallet = new ethers.Wallet(pKey, getProvider(NetworkProvider.Test));
                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    title: poolTitle,
                    aud: adminAudience,
                    network: 0,
                    token: {
                        address: testToken.address,
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(ethers.utils.isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;

                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address (bypassPolls = true)', () => {
        it('HTTP 200 ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    bypassPolls: true,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('GET /asset_pools/:address', () => {
        it('Deposit assets in pool', async () => {
            const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
            const amount = parseEther(rewardWithdrawAmount.toString());

            await testToken.approve(poolAddress, parseEther(rewardWithdrawAmount.toString()));
            await assetPool.deposit(amount);
        });

        it('HTTP 200 and expose pool information', async (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(Number(formatEther(await testToken.balanceOf(getAdmin(NetworkProvider.Test).address)))).toBe(
                        Number(formatEther(mintAmount)) - rewardWithdrawAmount,
                    );
                    expect(res.body.title).toEqual(poolTitle);
                    expect(res.body.address).toEqual(poolAddress);
                    expect(res.body.token.address).toEqual(testToken.address);
                    expect(res.body.token.name).toEqual(await testToken.name());
                    expect(res.body.token.symbol).toEqual(await testToken.symbol());
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(0);
                    expect(Number(res.body.rewardPollDuration)).toEqual(0);

                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        it('HTTP 200', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    rewardPollDuration: 10,
                    proposeWithdrawPollDuration: 10,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('HTTP 200 updated values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(10);
                    expect(Number(res.body.rewardPollDuration)).toEqual(10);

                    done();
                });
        });

        it('HTTP 500 if incorrect rewardPollDuration type (string) sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    rewardPollDuration: 'fivehundred',
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });

        it('HTTP 500 if incorrect proposeWithdrawPollDuration type (string) is sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    proposeWithdrawPollDuration: 'fivehundred',
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });

        it('HTTP should still have the correct values', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toEqual(true);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);

                    done();
                });
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
                .end(async (err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;
                    done();
                });
        });

        it('HTTP 200 after redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.id).toEqual(1);
                    expect(res.body.poll.id).toEqual(1);
                    expect(res.body.poll.withdrawDuration).toEqual(rewardWithdrawDuration);
                    expect(res.body.poll.withdrawAmount).toEqual(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('GET /rewards/:id', () => {
        it('HTTP 200 when successful', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 404 if reward can not be found', (done) => {
            user.get('/v1/rewards/2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });

        it('HTTP 500 if the id parameter is invalid', (done) => {
            user.get('/v1/rewards/id_invalid')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
    });

    describe('POST /members/:address', () => {
        let redirectURL = '';

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 302 when member is added', (done) => {
            user.patch(`/v1/members/${userAddress}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 for the redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(res.body.balance.amount).toEqual(0);
                    done();
                });
        });
    });

    describe('POST /rewards/:id/poll/finalize (rewardPoll)', () => {
        beforeAll(async () => {
            await timeTravel(rewardPollDuration);
        });

        it('HTTP 200 reward.id = 1', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toEqual(0);
                    expect(res.body.poll.withdrawAmount).toEqual(rewardWithdrawAmount);

                    done();
                });
        });

        it('HTTP 302 after finalizing the poll', async (done) => {
            user.post('/v1/rewards/1/poll/finalize')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 200 reward.pollId = 0', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.poll).toBeUndefined();
                    done();
                });
        });
    });

    describe('GET /rewards/:id (after finalizing)', () => {
        it('HTTP 200 and return updated withdrawAmount and state 1', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toEqual(1);
                    expect(res.body.withdrawAmount).toEqual(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('POST /rewards/:id/claim', () => {
        it('HTTP 200 and base64 string for the claim', (done) => {
            user.post('/v1/rewards/1/claim')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.base64).toContain('data:image/png;base64');

                    done();
                });
        });

        it('HTTP 302 when tx is handled', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'claimReward', [1], userWallet);

            user.post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('... pause 1s to index events', async () => {
            await new Promise((res) => setTimeout(res, 1000));
            expect(true).toBe(true);
        });

        it('HTTP 200 after return state Pending', (done) => {
            user.get('/v1/withdrawals?member=' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    const index = res.body.length - 1;
                    const withdrawal = res.body[index];

                    expect(withdrawal.approved).toEqual(true);
                    expect(withdrawal.state).toEqual(0);
                    expect(withdrawal.amount).toEqual(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 when tx is handled', async (done) => {
            user.post('/v1/rewards/1/give')
                .send({
                    member: userWallet.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.withdrawal).toEqual(3);

                    withdrawPollID = res.body.withdrawal;

                    done();
                });
        });
    });

    describe('GET /withdrawals/:id', () => {
        it('... pause 1s to index events', async () => {
            await new Promise((res) => setTimeout(res, 1000));
            expect(true).toBe(true);
        });

        it('HTTP 200 and return state Approved', (done) => {
            user.get(`/v1/withdrawals/${withdrawPollID}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.amount).toEqual(rewardWithdrawAmount);
                    expect(res.body.beneficiary).toEqual(userWallet.address);
                    expect(res.body.approved).toEqual(true);

                    done();
                });
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        beforeAll(async () => {
            await timeTravel(rewardWithdrawDuration);
        });

        it('HTTP 302 and redirect to withdrawal', async (done) => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawPollID],
                userWallet,
            );

            user.post('/v1/gas_station/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);

                    done();
                });
        });

        it('HTTP 200 and have the minted amount balance again', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.balance.amount).toBe(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('GET /asset_pools/:address (after withdaw)', () => {
        it('HTTP 200 and have 0 balance', (done) => {
            user.get(`/v1/asset_pools/${poolAddress}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.token.balance).toBe(0);

                    done();
                });
        });
    });

    describe('GET /withdrawals (before proposed withdrawal)', () => {
        it('HTTP 200 and return no items', async (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.length).toBe(2); // Pending and withdrawn withdrawal from reward given

                    done();
                });
        });
    });

    // Describe flow for rejected withdraw poll
    // Describe flow for rejected reward poll
});
