import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { admin } from '../../src/util/network';
import { mintAmount, poolTitle } from './lib/constants';
import { exampleTokenFactory } from './lib/network';
import { Contract } from 'ethers';

const http = request(server);

describe('OAuth2', () => {
    let authHeader: string, accessToken: string, assetPoolAddress: string, testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    afterAll(() => {
        server.close();
    });

    describe('GET /.well-known/openid-configuration', () => {
        it('HTTP 200', async (done) => {
            const res = await http.get('/.well-known/openid-configuration');
            expect(res.status).toBe(200);
            done();
        });
    });

    describe('GET /account', () => {
        it('HTTP 401', async (done) => {
            const res = await http.get('/v1/account');
            expect(res.status).toBe(401);
            done();
        });
    });

    describe('GET /reg', () => {
        it('HTTP 201', async (done) => {
            const res = await http.post('/reg').send({
                application_type: 'web',
                client_name: 'TestClient',
                grant_types: ['client_credentials'],
                redirect_uris: [],
                response_types: [],
                scope: 'openid admin',
            });
            authHeader = 'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');

            expect(res.status).toBe(201);
            done();
        });
    });

    describe('GET /token', () => {
        it('HTTP 401 (invalid access token)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'incorrect authorization code',
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid admin',
                });
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                error: 'invalid_request',
                error_description: 'invalid authorization header value format',
            });
            done();
        });
        it('HTTP 401 (invalid grant)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'authorization_code',
                    scope: 'openid admin user',
                });
            expect(res.body).toMatchObject({
                error: 'unauthorized_client',
                error_description: 'requested grant type is not allowed for this client',
            });
            expect(res.status).toBe(400);
            done();
        });

        it('HTTP 401 (invalid scope)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid admin user',
                });
            expect(res.body).toMatchObject({
                error: 'invalid_scope',
                error_description: 'requested scope is not whitelisted',
                scope: 'user',
            });
            expect(res.status).toBe(400);
            done();
        });

        it('HTTP 200 (success)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid admin',
                });
            accessToken = res.body.access_token;

            expect(res.status).toBe(200);
            done();
        });
    });

    describe('GET /account', () => {
        it('HTTP 403 (invalid token)', async (done) => {
            const res = await http.get('/v1/account').set({
                Authorization: `Bearer ${accessToken}`,
            });
            expect(res.status).toBe(403);
            done();
        });
    });
});
