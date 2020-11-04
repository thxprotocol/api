import { ethers } from 'ethers';
import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';
import { decryptString } from './lib/decrypt';
import { admin, provider } from '../src/util/network';
import { voter } from './lib/network';

const user = request.agent(app);

describe('Authentication', () => {
    beforeAll(async () => {
        await db.truncate();
    });

    describe('POST /signup', () => {
        it('HTTP 302 redirect if OK', (done) => {
            user.post('/v1/signup')
                .send({ email: 'test.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('POST /login', () => {
        it('HTTP 302 redirect if OK', (done) => {
            user.post('/v1/login')
                .send({ email: 'test.bot@thx.network', password: 'mellon' })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('GET /account', () => {
        it('HTTP 200', async (done) => {
            user.get('/v1/account').end((err, res) => {
                const pKey = decryptString(res.body.privateKey, 'mellon');
                const account = new ethers.Wallet(pKey, provider);
                const isAddress = ethers.utils.isAddress(account.address);

                expect(res.status).toBe(200);
                expect(isAddress).toBe(true);
                expect(res.body.address).toBe(account.address);
                done();
            });
        });
    });

    describe('PATCH /account ', () => {
        let redirectURL = '';

        it('HTTP 302', async (done) => {
            user.patch('/v1/account')
                .send({ address: voter.address })
                .end((err, res) => {
                    redirectURL = res.header.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 if OK', async (done) => {
            user.get('/v1/' + redirectURL).end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.privateKey).toBe('');
                expect(res.body.address).toBe(voter.address);
                done();
            });
        });
    });
});
