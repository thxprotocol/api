import { ethers } from 'ethers';
import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { decryptString } from './lib/decrypt';
import { admin, provider } from '../../src/util/network';
import { voter } from './lib/network';
import {
    getAuthCode,
    getAuthHeaders,
    getAccessToken,
    registerAuthorizationCodeClient,
    registerClientCredentialsClient,
} from './lib/registerClient';
import { exampleTokenFactory } from './lib/contracts';
import { mintAmount } from './lib/constants';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Encryption', () => {
    let testToken: any, adminAccessToken: string, userAccessToken: string, user2AccessToken: string;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe('POST /signup (with address)', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/signup')
                .set({ Authorization: adminAccessToken })
                .send({
                    address: voter.address,
                    email: 'test.address.bot@thx.network',
                    password: 'mellon',
                    confirmPassword: 'mellon',
                })
                .end((err, res) => {
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
                email: 'test.address.bot@thx.network',
                password: 'mellon',
            });

            userAccessToken = await getAccessToken(http2, client, authCode);
        });
        it('HTTP 200 and no privateKey', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: userAccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBe('');
                    expect(res.body.address).toBe(voter.address);
                    done();
                });
        });
    });

    describe('GET /logout', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/session/end').end((err, res) => {
                expect(res.status).toBe(200);
                done();
            });
        });
    });

    describe('POST /signup (without address)', () => {
        it('HTTP 302 redirect if OK', (done) => {
            user.post('/v1/signup')
                .set({ Authorization: adminAccessToken })
                .send({
                    email: 'test.encrypt.bot@thx.network',
                    password: 'mellon',
                    confirmPassword: 'mellon',
                })
                .end((err, res) => {
                    expect(res.status).toBe(201);
                    done();
                });
        });
    });

    describe('GET /account (encrypted)', () => {
        beforeAll(async () => {
            const client = await registerAuthorizationCodeClient(user);
            const headers = await getAuthHeaders(http3, client);
            const authCode = await getAuthCode(http3, headers, client, {
                email: 'test.encrypt.bot@thx.network',
                password: 'mellon',
            });

            user2AccessToken = await getAccessToken(http3, client, authCode);
        });

        it('HTTP 200 with address and encrypted private key', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: user2AccessToken })
                .end((err, res) => {
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
                .set({ Authorization: user2AccessToken })
                .send({ address: voter.address })
                .end((err, res) => {
                    redirectURL = res.header.location;
                    expect(res.status).toBe(303);
                    done();
                });
        });

        it('HTTP 200 with new addres and no privateKey', async (done) => {
            user.get(redirectURL)
                .set({ Authorization: user2AccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBe('');
                    expect(res.body.address).toBe(voter.address);
                    done();
                });
        });
    });
});
