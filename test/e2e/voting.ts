import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { timeTravel, signMethod, admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardTitle,
    rewardDescription,
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

describe('Voting', () => {
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

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 302 when member is promoted', (done) => {
            user.patch(`/v1/members/${userAddress}`)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address', () => {
        it('HTTP 302 ', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    rewardPollDuration: 10,
                    proposeWithdrawPollDuration: 10,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
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
                    title: rewardTitle,
                    description: rewardDescription,
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
                    expect(res.body.poll.pollId).toEqual(1);
                    pollID = res.body.poll.pollId;
                    done();
                });
        });
    });

    describe('POST /polls/:id/vote (rewardPoll)', () => {
        let redirectURL = '';

        it('HTTP 200 and base64 string for the yes vote', (done) => {
            user.post(`/v1/polls/${pollID}/vote`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    agree: true,
                })
                .end(async (err, res) => {
                    expect(res.body.base64).toContain('data:image/png;base64');
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 302 when tx is handled', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollVote', [1, true], userWallet);

            user.post('/v1/gas_station/base_poll')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({
                    call,
                    nonce,
                    sig,
                    redirect: `polls/${pollID}`,
                })
                .end((err, res) => {
                    redirectURL = res.headers.location;

                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 and increase yesCounter with 1', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(Number(res.body.totalVoted)).toEqual(1);
                    expect(Number(res.body.yesCounter)).toEqual(1);
                    expect(Number(res.body.noCounter)).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('POST /polls/:address/finalize (rewardPoll)', () => {
        let redirectURL = '';
        beforeAll(async () => {
            await timeTravel(rewardPollDuration);
        });
        it('HTTP 302 after finalizing the poll', async (done) => {
            const { call, nonce, sig } = await signMethod(poolAddress, 'rewardPollFinalize', [1], userWallet);
            user.post('/v1/gas_station/base_poll')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    redirectURL = res.header.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });
        it('HTTP 404 after getting the finalized poll', (done) => {
            user.get(`/v1/${redirectURL}`)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });
    describe('POST /withdrawals', () => {
        let redirectURL = '';

        it('HTTP 302', async (done) => {
            // Deposit 1000 in the pool
            await testToken.transfer(poolAddress, parseEther('1000'));

            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'proposeWithdraw',
                [parseEther('1000').toString(), userWallet.address],
                userWallet,
            );

            user.post('/v1/gas_station/asset_pool/propose_withdraw')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.header.location;
                    done();
                });
        });

        it('HTTP 200 if OK', async (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe('GET /withdrawals (after proposed withdrawal)', () => {
        it('HTTP 200 and return a list of 1 item', async (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    // one claimRewardFor and one proposeWithdraw
                    expect(Number(res.body.withdrawPolls.length)).toBe(1);
                    withdrawPollID = res.body.withdrawPolls[0];
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    // describe('POST /withdrawals/:address/withdraw (proposed withdrawal)', () => {
    //     let redirectURL = '';

    //     beforeAll(async () => {
    //         await timeTravel(proposeWithdrawPollDuration);
    //     });

    //     it('HTTP 200 and 0 balance', (done) => {
    //         user.get('/v1/members/' + userWallet.address)
    //             .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
    //             .end(async (err, res) => {
    //                 expect(Number(formatEther(res.body.token.balance))).toBe(0);
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });

    //     it('HTTP 302 and redirect to withdrawal', async (done) => {
    //         const { call, nonce, sig } = await signMethod(
    //             poolAddress,
    //             'withdrawPollFinalize',
    //             [withdrawPollID],
    //             userWallet,
    //         );

    //         user.post('/v1/gas_station/withdrawals/withdraw')
    //             .send({
    //                 call,
    //                 nonce,
    //                 sig,
    //             })
    //             .set({ AssetPool: poolAddress, Authorization: userAccessToken })
    //             .end(async (err, res) => {
    //                 redirectURL = res.headers.location;
    //                 expect(res.status).toBe(302);
    //                 done();
    //             });
    //     });

    //     it('HTTP 200 and increased balance', (done) => {
    //         user.get(redirectURL)
    //             .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
    //             .end(async (err, res) => {
    //                 expect(Number(formatEther(res.body.token.balance))).toBe(1000);
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });
    // });
    // describe('POST /poll/:address/vote (proposed withdrawal)', () => {
    //     let redirectURL = '';

    //     it('HTTP 302 if vote OK', async (done) => {
    //         console.log(withdrawPollID);
    //         const { call, nonce, sig } = await signMethod(
    //             poolAddress,
    //             'withdrawPollVote',
    //             [withdrawPollID, true],
    //             admin,
    //         );
    //         user.post('/v1/gas_station/base_poll/')
    //             .send({
    //                 call,
    //                 nonce,
    //                 sig,
    //                 redirect: `polls/${withdrawPollID}`,
    //             })
    //             .set({ AssetPool: poolAddress, Authorization: userAccessToken })
    //             .end(async (err, res) => {
    //                 redirectURL = res.headers.location;
    //                 expect(res.status).toBe(302);
    //                 done();
    //             });
    //     });

    //     it('HTTP 200 and increase yesCounter with 1', (done) => {
    //         user.get(redirectURL)
    //             .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
    //             .end(async (err, res) => {
    //                 expect(Number(res.body.totalVoted)).toEqual(1);
    //                 expect(Number(res.body.yesCounter)).toEqual(1);
    //                 expect(Number(res.body.noCounter)).toEqual(0);
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });
    // });

    // describe('POST /polls/:address/vote (withdrawPoll)', () => {
    //     let redirectURL = '';

    //     it('HTTP 200 and base64 string for the yes vote', (done) => {
    //         user.post(`/v1/polls/${withdrawPollID}/vote`)
    //             .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
    //             .send({
    //                 agree: true,
    //             })
    //             .end(async (err, res) => {
    //                 expect(res.body.base64).toContain('data:image/png;base64');
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });

    //     it('HTTP 302 when tx is handled', async (done) => {
    //         // Manager should vote for this poll
    //         const { call, nonce, sig } = await signMethod(
    //             poolAddress,
    //             'withdrawPollVote',
    //             [withdrawPollID, true],
    //             userWallet,
    //         );

    //         user.post('/v1/gas_station/base_poll')
    //             .send({
    //                 call,
    //                 nonce,
    //                 sig,
    //                 redirect: `polls/${withdrawPollID}`,
    //             })
    //             .set({ AssetPool: poolAddress, Authorization: userAccessToken })
    //             .end(async (err, res) => {
    //                 redirectURL = res.headers.location;

    //                 expect(res.status).toBe(302);
    //                 done();
    //             });
    //     });

    //     it('HTTP 200 and increase yesCounter with 1', (done) => {
    //         user.get(redirectURL)
    //             .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
    //             .end(async (err, res) => {
    //                 expect(Number(res.body.totalVoted)).toEqual(1);
    //                 expect(Number(res.body.yesCounter)).toEqual(1);
    //                 expect(Number(res.body.noCounter)).toEqual(0);
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });
    // });
});
