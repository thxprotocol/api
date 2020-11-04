import { ethers } from 'ethers';
import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';

const user = request.agent(app);

describe('Authentication', () => {
    beforeAll(async () => {
        await db.truncate();
    });

    describe('POST /login (no auth)', () => {
        it('HTTP 400 if payload is missing', async (done) => {
            user.post('/v1/login').end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
        });
        it('HTTP 400 if email is missing', (done) => {
            user.post('/v1/login')
                .send({ password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
        it('HTTP 400 if password is missing', (done) => {
            user.post('/v1/login')
                .send({ email: 'test.auth.bot@thx.network' })
                .end((err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
        it('HTTP 401 if account is not found', (done) => {
            user.post('/v1/login')
                .send({ email: 'test.auth.bot@thx.network', password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });

    describe('POST /signup', () => {
        it('HTTP 500 if payload is missing', (done) => {
            user.post('/v1/signup').end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
        });
        it('HTTP 500 if email is missing', (done) => {
            user.post('/v1/signup')
                .send({ password: 'mellon', confirmPassword: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
        it('HTTP 500 if password is missing', (done) => {
            user.post('/v1/signup')
                .send({ email: 'test.auth.bot@thx.network', confirmPassword: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
        it('HTTP 500 if confirmPassword is missing', (done) => {
            user.post('/v1/signup')
                .send({ email: 'test.auth.bot@thx.network', password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(400);
                    done();
                });
        });
        it('HTTP 302 if payload is correct', (done) => {
            user.post('/v1/signup')
                .send({ email: 'test.auth.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
        it('HTTP 422 if email already exists', (done) => {
            user.post('/v1/signup')
                .send({ email: 'test.auth.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(422);
                    done();
                });
        });
    });

    describe('POST /login', () => {
        let redirectURL = '';

        it('HTTP 404 if account lookup fails', (done) => {
            user.post('/v1/login')
                .send({ email: 'bad.bot@thx.network', password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });

        it('HTTP 302 if credentials are correct', (done) => {
            user.post('/v1/login')
                .send({ email: 'test.auth.bot@thx.network', password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    redirectURL = res.header.location;
                    done();
                });
        });

        it('HTTP 200 after redirect', (done) => {
            user.get('/v1/' + redirectURL).end((err, res) => {
                expect(res.status).toBe(200);
                done();
            });
        });
    });

    describe('GET /account (after login)', () => {
        it('HTTP 200', async (done) => {
            user.get('/v1/account').end((err, res) => {
                expect(res.status).toBe(200);
                done();
            });
        });
    });

    describe('POST /logout', () => {
        it('HTTP 200 if logout is handled', (done) => {
            user.get('/v1/logout').end((err, res) => {
                expect(res.status).toBe(200);
                done();
            });
        });
    });

    describe('GET /account (after logout)', () => {
        it('HTTP 401', async (done) => {
            user.get('/v1/account').end((err, res) => {
                expect(res.status).toBe(401);
                done();
            });
        });
    });
});
