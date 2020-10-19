import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';
import mongoose from 'mongoose';
import { deployTestTokenContract } from '../src/util/network';
import { MongoMemoryServer } from 'mongodb-memory-server';

const user = request.agent(app);
const poolTitle = 'Volunteers United';

let poolAddress: any, testTokenInstance: any;

beforeAll(async () => {
    const server = new MongoMemoryServer({
        instance: {
            ip: 'localhost',
            port: 27027,
            dbName: 'test',
        },
        autoStart: true,
    });

    testTokenInstance = await deployTestTokenContract();

    await server.ensureInstance();
});

afterAll(async () => {
    await mongoose.disconnect();
    return await db.disconnect();
});

describe('POST /login (no auth)', () => {
    it('returns 500 if payload is missing', async (done) => {
        user.post('/v1/login').end((err, res) => {
            expect(res.status).toBe(400);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/login')
            .send({ password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 401 if account is not found', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(401);
                done();
            });
    });
});

describe('POST /signup', () => {
    it('returns 500 if payload is missing', (done) => {
        user.post('/v1/signup').end((err, res) => {
            expect(res.status).toBe(400);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/signup')
            .send({ password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if confirmPassword is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 302 if payload is correct', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(302);
                done();
            });
    });
    it('returns 403 if email already exists', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(403);
                done();
            });
    });
});

describe('POST /logout', () => {
    it('returns 200 if logout is handled', (done) => {
        user.get('/v1/logout').end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('GET /account (after logout)', () => {
    it('should return a 401', async (done) => {
        user.get('/v1/account').end((err, res) => {
            expect(res.status).toBe(401);
            done();
        });
    });
});

describe('POST /login', () => {
    let redirectURL = '';

    it('should return a 401 if credentials are incorrect', (done) => {
        user.post('/v1/login')
            .send({ email: 'bad.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(401);
                done();
            });
    });

    it('should return a 302 if credentials are correct', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(302);
                redirectURL = res.header.location;
                done();
            });
    });

    it('should return a 200 after redirect', (done) => {
        user.get('/v1/' + redirectURL).end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('GET /account (after login)', () => {
    it('should return a 200', async (done) => {
        user.get('/v1/account').end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('POST /asset_pools', () => {
    it('should return a 200', async (done) => {
        user.post('/v1/asset_pools')
            .send({ title: poolTitle, token: testTokenInstance.options.address })
            .end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.address).toContain('0x');
                poolAddress = res.body.address;
                done();
            });
    });
});

describe('GET /asset_pools/:address', () => {
    it('should return a 200t', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.body.title).toEqual(poolTitle);
                expect(res.body.address).toEqual(poolAddress);
                expect(res.body.token.address).toEqual(testTokenInstance.options.address);
                expect(res.body.token.name).toEqual(await testTokenInstance.methods.name().call());
                expect(res.body.token.symbol).toEqual(await testTokenInstance.methods.symbol().call());
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(0);
                expect(Number(res.body.rewardPollDuration)).toEqual(0);
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 404 if pool does not exist', (done) => {
        user.get('/v1/asset_pools/0x0000000000000000000000000000000000000000')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(404);
                done();
            });
    });
});

describe('PUT /asset_pools/:address', () => {
    it('should return a 302 ', (done) => {
        user.put('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration: 10,
                proposeWithdrawPollDuration: 10,
            })
            .end(async (err, res) => {
                expect(res.status).toBe(302);
                done();
            });
    });

    it('should redirect to asset_pools/:address', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(10);
                expect(Number(res.body.rewardPollDuration)).toEqual(10);
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 500 if incorrect rewardPollDuration value is sent ', (done) => {
        user.put('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration: 'fivehundred',
            })
            .end(async (err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });

    it('should return a 500 if incorrect proposeWithdrawPollDuration value is sent ', (done) => {
        user.put('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                proposeWithdrawPollDuration: 'fivehundred',
            })
            .end(async (err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });

    it('should still have the correct values', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(10);
                expect(Number(res.body.rewardPollDuration)).toEqual(10);
                expect(res.status).toBe(200);
                done();
            });
    });
});

// const rewardTitle = 'Complete your profile!';
// const rewardDescription = 'Earn great rewards for tiny things.';

// describe('POST /rewards/', () => {
//     let redirectURL = '';

//     it('should return a 302 ', (done) => {
//         user.post('/v1/rewards/')
//             .set({ AssetPool: poolAddress })
//             .send({
//                 withdrawAmount: '20000000000000000000',
//                 withdrawDuration: '400',
//                 title: 'Complete your profile!',
//                 description: 'You should do this and that...',
//             })
//             .end(async (err, res) => {
//                 expect(res.status).toBe(302);
//                 done();
//             });
//     });

//     it('should return a 200 after redirect', (done) => {
//         user.get('/v1/' + redirectURL)
//             .set({ AssetPool: poolAddress })
//             .end(async (err, res) => {
//                 expect(Number(res.body.id)).toEqual(0);
//                 expect(res.body.title).toEqual(rewardTitle);
//                 expect(res.body.description).toEqual(rewardDescription);
//                 expect(res.status).toBe(200);
//                 done();
//             });
//     });
// });
