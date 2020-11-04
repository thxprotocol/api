import { ethers } from 'ethers';
import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';
import { decryptString } from './lib/decrypt';
import { admin, provider } from '../src/util/network';
import { voter } from './lib/network';

const user = request.agent(app);

describe('Encryption', () => {
    beforeAll(async () => {
        await db.truncate();
    });

    describe('POST /signup (with address)', () => {
        it('HTTP 302 redirect if OK', (done) => {
            user.post('/v1/signup')
                .send({
                    address: voter.address,
                    email: 'test.address.bot@thx.network',
                    password: 'mellon',
                    confirmPassword: 'mellon',
                })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('GET /account', () => {
        it('HTTP 200 and no privateKey', async (done) => {
            user.get('/v1/account').end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.privateKey).toBe('');
                expect(res.body.address).toBe(voter.address);
                done();
            });
        });
    });

    describe('GET /logout', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/logout').end((err, res) => {
                expect(res.status).toBe(200);
                done();
            });
        });
    });

    describe('POST /signup (without address)', () => {
        it('HTTP 302 redirect if OK', (done) => {
            user.post('/v1/signup')
                .send({
                    email: 'test.encrypt.bot@thx.network',
                    password: 'mellon',
                    confirmPassword: 'mellon',
                })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('GET /account', () => {
        it('HTTP 200 with address and encrypted private key', async (done) => {
            user.get('/v1/account').end((err, res) => {
                const pKey = decryptString(res.body.privateKey, 'mellon');
                const account = new ethers.Wallet(pKey, provider);
                const isAddress = ethers.utils.isAddress(account.address);

                try {
                    decryptString(res.body.privateKey, 'wrongpassword');
                } catch (err) {
                    expect(err.toString()).toEqual('Error: Unsupported state or unable to authenticate data');
                }

                expect(res.status).toBe(200);
                expect(isAddress).toBe(true);
                expect(res.body.address).toBe(account.address);
                done();
            });
        });
    });
    describe('PATCH /account ', () => {
        let redirectURL = '';

        it('HTTP 302 with address: voter.address', async (done) => {
            user.patch('/v1/account')
                .send({ address: voter.address })
                .end((err, res) => {
                    redirectURL = res.header.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it('HTTP 200 with new addres and no privateKey', async (done) => {
            user.get('/v1/' + redirectURL).end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.privateKey).toBe('');
                expect(res.body.address).toBe(voter.address);
                done();
            });
        });
    });
});
