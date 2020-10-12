import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';
import mongoose from 'mongoose';
import { deployTestTokenContract } from '../src/util/network';

const user = request.agent(app);

let poolAddress: any, testTokenInstance: any;

(async () => {
    testTokenInstance = await deployTestTokenContract();
})();

afterAll(async () => {
    await mongoose.disconnect();
    await db.disconnect();
});

describe('POST /login (no auth)', () => {
    it('returns 500 if payload is missing', async (done) => {
        user.post('/v1/login').end((err, res) => {
            expect(res.status).toBe(500);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/login')
            .send({ password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network' })
            .end((err, res) => {
                expect(res.status).toBe(500);
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
            expect(res.status).toBe(500);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/signup')
            .send({ password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });
    it('returns 500 if confirmPassword is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(500);
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
    it('returns 302 if logout is handled', (done) => {
        user.get('/v1/logout').end((err, res) => {
            expect(res.status).toBe(302);
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
        user.get('/v1' + redirectURL).end((err, res) => {
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
            .send({ title: 'Volunteers United', token: testTokenInstance.options.address })
            .end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.address).toContain('0x');
                poolAddress = res.body.address;
                done();
            });
    });
});

describe('GET /asset_pools', () => {
    it('should return a 200 after redirect', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end((err, res) => {
                expect(res.body.address).toEqual(poolAddress);
                expect(res.body.token.address).toEqual(testTokenInstance.options.address);
                expect(res.status).toBe(200);
                done();
            });
    });
});
