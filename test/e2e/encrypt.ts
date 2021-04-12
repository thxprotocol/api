import { ethers, Wallet } from 'ethers';
import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { decryptString } from '../../src/util/decrypt';
import { getAdmin, getProvider, NetworkProvider } from '../../src/util/network';
import { signMethod } from './lib/network';
import {
    getAuthCode,
    getAuthHeaders,
    getAccessToken,
    registerClientCredentialsClient,
    registerDashboardClient,
    registerWalletClient,
} from './lib/registerClient';
import { exampleTokenFactory } from './lib/network';
import { mintAmount, poolTitle, newAddress, userEmail, userPassword } from './lib/constants';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Encryption', () => {
    let testToken: any,
        adminAccessToken: string,
        dashboardAccessToken: string,
        adminAudience: string,
        userAccessToken: string,
        poolAddress: string,
        decryptedWallet: Wallet,
        tempAddress: string;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);
        const admin = getAdmin(NetworkProvider.Test);

        adminAccessToken = credentials.accessToken;
        adminAudience = credentials.aud;

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe('POST /signup', () => {
        it('HTTP 201 if OK', (done) => {
            user.post('/v1/signup')
                .set({ Authorization: adminAccessToken })
                .send({ email: userEmail, password: userPassword, confirmPassword: userPassword })
                .end((err, res) => {
                    expect(res.status).toBe(201);
                    done();
                });
        });
    });

    describe('POST /asset_pools', () => {
        beforeAll(async () => {
            const dashboardClient = await registerDashboardClient(user);
            const dashboardHeaders = await getAuthHeaders(http3, dashboardClient, 'openid dashboard');
            const dashboardAuthCode = await getAuthCode(http3, dashboardHeaders, dashboardClient, {
                email: userEmail,
                password: userPassword,
            });

            dashboardAccessToken = await getAccessToken(http3, dashboardClient, dashboardAuthCode);
        });

        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    title: poolTitle,
                    aud: adminAudience,
                    network: 0,
                    token: {
                        address: testToken.address,
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    poolAddress = res.body.address;
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
                    tempAddress = res.body.address;
                    expect(res.status).toBe(201);
                    done();
                });
        });
    });

    describe('POST /members/:address', () => {
        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: tempAddress })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe('GET /account (encrypted)', () => {
        beforeAll(async () => {
            const walletClient = await registerWalletClient(user);
            const walletHeaders = await getAuthHeaders(http2, walletClient, 'openid user email offline_access');
            const walletAuthCode = await getAuthCode(http2, walletHeaders, walletClient, {
                email: 'test.encrypt.bot@thx.network',
                password: 'mellon',
            });

            userAccessToken = await getAccessToken(http2, walletClient, walletAuthCode);
        });

        it('HTTP 200 with address and encrypted private key', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: userAccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);

                    const pKey = decryptString(res.body.privateKey, 'mellon');

                    decryptedWallet = new ethers.Wallet(pKey, getProvider(NetworkProvider.Test));

                    try {
                        decryptString(res.body.privateKey, 'wrongpassword');
                    } catch (err) {
                        expect(err.toString()).toEqual('Error: Unsupported state or unable to authenticate data');
                    }

                    expect(ethers.utils.isAddress(decryptedWallet.address)).toBe(true);
                    expect(res.body.address).toBe(decryptedWallet.address);
                    done();
                });
        });
    });

    describe('POST /gas_station/upgrade_address ', () => {
        it('HTTP 200 success', async (done) => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'upgradeAddress',
                [tempAddress, newAddress],
                decryptedWallet,
            );

            user.post('/v1/gas_station/upgrade_address')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send({ oldAddress: tempAddress, newAddress, call, nonce, sig })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });

        it('HTTP 200 with new addres and no privateKey', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: userAccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.privateKey).toBe('');
                    expect(res.body.address).toBe(newAddress);
                    done();
                });
        });

        it('HTTP 200 show new member address for old member address', async (done) => {
            user.get('/v1/members/' + tempAddress)
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.address).toBe(newAddress);
                    done();
                });
        });
    });
});
