import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
import { poolTitle, mintAmount, rewardWithdrawAmount, rewardWithdrawDuration } from './lib/constants';
import { Contract, ethers } from 'ethers';
import { registerClientCredentialsClient } from './lib/registerClient';

const user = request(server);

describe('Bypass Polls', () => {
    let adminAccessToken: string, redirectURL: string, poolAddress: string, testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 response OK', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', adminAccessToken)
                .send({
                    title: poolTitle,
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

        it('HTTP 200 response OK', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toBe(false);

                    done();
                });
        });
    });

    describe('POST /rewards 1 (bypass disabled)', () => {
        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .end((err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 reward storage OK ', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(0);

                    done();
                });
        });
    });

    describe('POST /rewards/1/finalize (bypass disabled)', () => {
        it('HTTP 200 reward storage OK', (done) => {
            user.post('/v1/rewards/1/poll/finalize')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(0);
                    expect(res.body.poll).toBeUndefined();
                    expect(res.body.withdrawAmount).toBe(0);

                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address (bypassPolls = true)', () => {
        it('HTTP 302 redirect to pool', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({ bypassPolls: true })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 response OK', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toBe(true);

                    done();
                });
        });
    });

    describe('POST /rewards 2 (bypass enabled)', () => {
        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                })
                .end((err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;
                    done();
                });
        });

        it('HTTP 200 reward storage OK ', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(0);
                    expect(res.body.withdrawAmount).toBe(0);
                    expect(res.body.poll.withdrawAmount).toBe(rewardWithdrawAmount);

                    done();
                });
        });
    });

    describe('POST /rewards/2/finalize (bypass enabled)', () => {
        it('HTTP 200 response OK', (done) => {
            user.post('/v1/rewards/2/poll/finalize')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(1);
                    expect(res.body.withdrawAmount).toBe(rewardWithdrawAmount);
                    expect(res.body.poll).toBeUndefined();

                    done();
                });
        });
    });

    describe('PATCH /asset_pools/:address (bypassPolls = false)', () => {
        it('HTTP 302 redirect to pool', (done) => {
            user.patch('/v1/asset_pools/' + poolAddress)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({ bypassPolls: false })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);

                    redirectURL = res.headers.location;

                    done();
                });
        });

        it('HTTP 200 response OK', (done) => {
            user.get(redirectURL)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.bypassPolls).toBe(false);

                    done();
                });
        });
    });
});
