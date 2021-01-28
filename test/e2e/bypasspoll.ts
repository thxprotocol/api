import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { admin } from './lib/network';
import { exampleTokenFactory } from './lib/contracts';
import { poolTitle, mintAmount } from './lib/constants';
import { Contract, ethers } from 'ethers';
import { registerClientCredentialsClient } from './lib/registerClient';
import { downgradeFromBypassPolls, updateToBypassPolls, solutionContract } from '../../src/util/network';

const user = request(server);

describe('Bypass Polls', () => {
    let adminAccessToken: string, poolAddress: string, pollID: string, redirectURL: string, testToken: Contract;

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
                .send({ title: poolTitle, token: testToken.address })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    expect(ethers.utils.isAddress(res.body.address)).toBe(true);

                    poolAddress = res.body.address;
                    done();
                });
        });
    });

    describe('POST /rewards 1 (bypass disabled)', () => {
        beforeAll(async () => {
            await downgradeFromBypassPolls(solutionContract(poolAddress));
        });

        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: '20000000000000000000',
                    withdrawDuration: '0',
                    title: 'Complete your profile!',
                    description: 'You should do this and that...',
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
                    expect(res.body.pollId).toBe(1);
                    expect(res.body.state).toBe(0);
                    pollID = res.body.pollId;
                    done();
                });
        });
    });

    describe('POST /rewards/1/finalize (bypass disabled)', () => {
        it('HTTP 200 response OK', (done) => {
            user.post(`/v1/polls/${pollID}/finalize`)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.transactionHash).toContain('0x');

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
                    expect(res.body.pollId).toBe(0);
                    expect(res.body.state).toBe(0);

                    done();
                });
        });
    });

    describe('POST /rewards 2 (bypass enabled)', () => {
        beforeAll(async () => {
            await updateToBypassPolls(solutionContract(poolAddress));
        });

        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: '20000000000000000000',
                    withdrawDuration: '0',
                    title: 'Complete your profile!',
                    description: 'You should do this and that...',
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
                    expect(res.body.pollId).toBe(2);
                    expect(res.body.state).toBe(0);
                    pollID = res.body.pollId;
                    done();
                });
        });
    });

    describe('POST /rewards/2/finalize (bypass enabled)', () => {
        it('HTTP 200 response OK', (done) => {
            user.post(`/v1/polls/${pollID}/finalize`)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.transactionHash).toContain('0x');

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
                    expect(res.body.pollId).toBe(0);
                    expect(res.body.state).toBe(1);

                    done();
                });
        });
    });

    describe('POST /rewards 3 (bypass disabled)', () => {
        beforeAll(async () => {
            await downgradeFromBypassPolls(solutionContract(poolAddress));
        });

        it('HTTP 302 redirect OK', (done) => {
            user.post('/v1/rewards')
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .send({
                    withdrawAmount: '20000000000000000000',
                    withdrawDuration: '0',
                    title: 'Complete your profile!',
                    description: 'You should do this and that...',
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
                    expect(res.body.pollId).toBe(3);
                    expect(res.body.state).toBe(0);
                    pollID = res.body.pollId;
                    done();
                });
        });
    });

    describe('POST /rewards/3/finalize (bypass enabled)', () => {
        beforeAll(async () => {
            await updateToBypassPolls(solutionContract(poolAddress));
        });

        it('HTTP 200 response OK', (done) => {
            user.post(`/v1/polls/${pollID}/finalize`)
                .set({
                    AssetPool: poolAddress,
                    Authorization: adminAccessToken,
                })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.transactionHash).toContain('0x');

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
                    expect(res.body.pollId).toBe(0);
                    expect(res.body.state).toBe(1);

                    done();
                });
        });
    });
});
