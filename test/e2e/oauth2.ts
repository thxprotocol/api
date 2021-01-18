import request from 'supertest';
import app from '../../src/app';
import db from '../../src/util/database';
import { admin } from './lib/network';
import { mintAmount, poolTitle } from './lib/constants';
import { exampleTokenFactory } from './lib/contracts';
import { Contract } from 'ethers';

const http = request(app);

describe('OAuth2', () => {
    let authHeader: string, accessToken: string, assetPoolAddress: string, testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe('GET /.well-known/openid-configuration', () => {
        it('HTTP 401', async (done) => {
            const res = await http.get('/.well-known/openid-configuration');
            expect(res.status).toBe(200);
            done();
        });
    });

    describe('GET /accounts', () => {
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
        it('HTTP 200', async (done) => {
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

    describe('POST /asset_pools', () => {
        it('HTTP 201', async (done) => {
            const res = await http.post('/v1/asset_pools').set('Authorization', `Bearer ${accessToken}`).send({
                title: poolTitle,
                token: testToken.address,
            });
            assetPoolAddress = res.body.address;
            expect(res.status).toBe(201);
            done();
        });
    });

    describe('GET /asset_pools', () => {
        it('HTTP 200', async (done) => {
            const res = await http.get(`/v1/asset_pools/${assetPoolAddress}`).set({
                AssetPool: assetPoolAddress,
                Authorization: `Bearer ${accessToken}`,
            });
            expect(res.status).toBe(200);
            done();
        });
    });
});
