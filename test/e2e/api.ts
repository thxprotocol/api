import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { callFunction, getAdmin, getProvider, NetworkProvider, sendTransaction } from '../../src/util/network';
import { timeTravel, signMethod, deployExampleToken } from './lib/network';
import { rewardWithdrawAmount, rewardWithdrawDuration, mintAmount, userEmail, userPassword } from './lib/constants';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { Contract } from 'web3-eth-contract';

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
import { Account } from 'web3-core';
import { Withdrawal } from '../../src/models/Withdrawal';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Happy Flow', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        userAddress: string,
        withdrawPollID: string,
        userWallet: Account,
        testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);

        adminAccessToken = credentials.accessToken;

        testToken = await deployExampleToken();
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
                    const web3 = getProvider(NetworkProvider.Test);
                    userWallet = web3.eth.accounts.privateKeyToAccount(pKey);
                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: 0,
                    token: {
                        address: testToken.options.address,
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

    describe('GET /asset_pools/:address', () => {
        it('Deposit assets in pool', async () => {
            const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
            const amount = parseEther(rewardWithdrawAmount.toString());

            await sendTransaction(
                testToken.options.address,
                testToken.methods.approve(poolAddress, parseEther(rewardWithdrawAmount.toString())),
                NetworkProvider.Test,
            );
            await sendTransaction(assetPool.options.address, assetPool.methods.deposit(amount), NetworkProvider.Test);
        });

        it('HTTP 200 and expose pool information', async (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(
                        Number(
                            formatEther(
                                await callFunction(
                                    testToken.methods.balanceOf(getAdmin(NetworkProvider.Test).address),
                                    NetworkProvider.Test,
                                ),
                            ),
                        ),
                    ).toBe(Number(formatEther(mintAmount)) - rewardWithdrawAmount);
                    expect(res.body.address).toEqual(poolAddress);
                    expect(res.body.token.address).toEqual(testToken.options.address);
                    expect(res.body.token.name).toEqual(await testToken.methods.name().call());
                    expect(res.body.token.symbol).toEqual(await testToken.methods.symbol().call());
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(0);
                    expect(Number(res.body.rewardPollDuration)).toEqual(0);

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
                    expect(res.body.poll).toBeUndefined();

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
                    expect(res.body.token.balance).toEqual(0);
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
                    expect(res.body.poll).toBeUndefined();
                    expect(res.body.state).toEqual(1);
                    expect(res.body.withdrawAmount).toEqual(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('POST /rewards/:id/claim', () => {
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
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);

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
                    expect(res.body.length).toBe(2);

                    done();
                });
        });
    });

    // Describe flow for rejected withdraw poll
    // Describe flow for rejected reward poll
});
