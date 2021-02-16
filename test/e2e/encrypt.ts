import { ethers, Wallet } from 'ethers';
import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { decryptString } from './lib/decrypt';
import { admin, provider } from '../../src/util/network';
import { signMethod, voter } from './lib/network';
import {
    getAuthCode,
    getAuthHeaders,
    getAccessToken,
    registerAuthorizationCodeClient,
    registerClientCredentialsClient,
} from './lib/registerClient';
import { exampleTokenFactory } from './lib/contracts';
import { mintAmount, poolTitle, newAddress } from './lib/constants';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Encryption', () => {
    let testToken: any,
        adminAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        decryptedWallet: Wallet,
        tempAddress: string;

    beforeAll(async () => {
        await db.truncate();

        adminAccessToken = await registerClientCredentialsClient(user);

        testToken = await exampleTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();

        // Create an asset pool
        const res = await user.post('/v1/asset_pools').set({ Authorization: adminAccessToken }).send({
            title: poolTitle,
            token: testToken.address,
        });

        poolAddress = res.body.address;
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
            const client = await registerAuthorizationCodeClient(user);
            const headers = await getAuthHeaders(http3, client);
            const authCode = await getAuthCode(http3, headers, client, {
                email: 'test.encrypt.bot@thx.network',
                password: 'mellon',
            });

            userAccessToken = await getAccessToken(http3, client, authCode);
        });

        it('HTTP 200 with address and encrypted private key', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: userAccessToken })
                .end((err, res) => {
                    const pKey = decryptString(res.body.privateKey, 'mellon');

                    decryptedWallet = new ethers.Wallet(pKey, provider);

                    try {
                        decryptString(res.body.privateKey, 'wrongpassword');
                    } catch (err) {
                        expect(err.toString()).toEqual('Error: Unsupported state or unable to authenticate data');
                    }

                    expect(res.status).toBe(200);
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
    });
});
