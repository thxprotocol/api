import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { timeTravel, signMethod, admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
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
    registerAuthorizationCodeClient,
    registerClientCredentialsClient,
} from './lib/registerClient';
import { decryptString } from './lib/decrypt';
import { provider } from '../../src/util/network';

const user = request(server);
const http2 = request.agent(server);

describe('Happy Flow', () => {
    let adminAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        pollID: string,
        userAddress: string,
        withdrawPollID: string,
        userWallet: Wallet,
        testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

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
            const client = await registerAuthorizationCodeClient(user);
            const headers = await getAuthHeaders(http2, client);
            const authCode = await getAuthCode(http2, headers, client, {
                email: userEmail,
                password: userPassword,
            });

            userAccessToken = await getAccessToken(http2, client, authCode);
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
                    userWallet = new ethers.Wallet(pKey, provider);
                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', adminAccessToken)
                .send({
                    title: poolTitle,
                    token: testToken.address,
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
        it('HTTP 302 ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    bypassPolls: true,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('GET /asset_pools/:address', () => {
        it('HTTP 200 and expose pool information', async (done) => {
            // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
            await testToken.transfer(poolAddress, parseEther(rewardWithdrawAmount.toString()));

            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    const adminBalance = await testToken.balanceOf(admin.address);

                    expect(Number(formatEther(adminBalance))).toBe(
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
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 404 if pool does not exist', (done) => {
            user.get('/v1/asset_pools/0x0000000000000000000000000000000000000000')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        let redirectURL = '';
        it('HTTP 302 ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    rewardPollDuration: 10,
                    proposeWithdrawPollDuration: 10,
                })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;

                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 after redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(10);
                    expect(Number(res.body.rewardPollDuration)).toEqual(10);
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 500 if incorrect rewardPollDuration type (string) sent ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
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
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
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
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.bypassPolls).toEqual(true);
                    expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                    expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);
                    expect(res.status).toBe(200);
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
                    pollID = res.body.poll.id;
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
                    expect(Number(formatEther(res.body.token.balance))).toEqual(0);
                    done();
                });
        });
    });

    describe('POST /polls/:id/finalize (rewardPoll)', () => {
        beforeAll(async () => {
            await timeTravel(rewardPollDuration);
        });

        it('HTTP 200 reward.id = 1', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.poll.id).toBe(1);

                    done();
                });
        });

        it('HTTP 302 after finalizing the poll', async (done) => {
            user.post('/v1/polls/' + pollID + '/finalize')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 200 reward.pollId = 0', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.body.poll).toBeUndefined();
                    expect(res.status).toBe(200);
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
                    expect(res.body.withdrawAmount).toEqual(rewardWithdrawAmount);
                    expect(res.body.state).toEqual(1);

                    done();
                });
        });
    });

    describe('POST /rewards/:id/claim', () => {
        let redirectURL = '';

        it('HTTP 200 and base64 string for the claim', (done) => {
            user.post('/v1/rewards/1/claim')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.base64).toContain('data:image/png;base64');
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 302 when tx is handled', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'claimReward', [1], userWallet);

            user.post('/v1/gas_station/asset_pool/claim_reward')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.headers.location;
                    done();
                });
        });

        it('HTTP 200 after return state Pending', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    withdrawPollID = res.body.pollId;
                    expect(res.body.approved).toEqual(true); // polls are bypassed by defailt
                    expect(Number(formatEther(res.body.amount))).toEqual(rewardWithdrawAmount);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 when tx is handled', async (done) => {
            user.post('/v1/rewards/1/give')
                .send({
                    member: admin.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.withdrawPoll).toEqual(3);
                    done();
                });
        });
    });

    describe('GET /withdrawals/:id', () => {
        it('HTTP 200 and return state Approved', (done) => {
            user.get(`/v1/withdrawals/${withdrawPollID}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(Number(formatEther(res.body.amount))).toEqual(rewardWithdrawAmount);
                    expect(res.body.beneficiary).toEqual(userWallet.address);
                    expect(res.body.approved).toEqual(true);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('POST /withdrawals/:address/withdraw', () => {
        let redirectURL = '';

        beforeAll(async () => {
            await timeTravel(rewardWithdrawDuration);
        });

        it('HTTP 200 and base64 string for the withdraw', (done) => {
            user.post(`/v1/withdrawals/${withdrawPollID}/withdraw`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.body.base64).toContain('data:image/png;base64');
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 302 and redirect to withdrawal', async (done) => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawPollID],
                userWallet,
            );

            user.post('/v1/gas_station/withdrawals/withdraw')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 and have the minted amount balance again', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(Number(formatEther(res.body.token.balance))).toBe(rewardWithdrawAmount);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('GET /asset_pools/:address (after withdaw)', () => {
        it('HTTP 200 and have 0 balance', (done) => {
            user.get(`/v1/asset_pools/${poolAddress}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(Number(formatEther(res.body.token.balance))).toBe(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('GET /withdrawals (before proposed withdrawal)', () => {
        it('HTTP 200 and return no items', async (done) => {
            user.get(`/v1/withdrawals?member=${admin.address}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(Number(res.body.withdrawPolls.length)).toBe(1);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    // Describe flow for reward give
    // Describe flow for rejected withdraw poll
    // Describe flow for rejected reward poll
});
