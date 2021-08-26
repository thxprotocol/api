import { Account } from 'web3-core';
import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { decryptString } from '../../src/util/decrypt';
import { getProvider, NetworkProvider } from '../../src/util/network';
import { deployExampleToken, signMethod, signupWithAddress, signupWithPrivateKey } from './lib/network';
import { newAddress, userEmail, userEmail2, userPassword, userPassword2 } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { isAddress } from 'web3-utils';
import { getClientCredentialsToken } from './lib/clientCredentials';
import { getAuthCodeToken } from './lib/authorizationCode';

const admin = request(server);
const user = request.agent(server);
const user2 = request.agent(server);

describe('Encryption', () => {
    let testToken: Contract,
        adminAccessToken: string,
        dashboardAccessToken: string,
        userAccessToken: string,
        poolAddress: string,
        decryptedWallet: Account,
        userWallet: Account,
        tempAddress: string;

    beforeAll(async () => {
        await db.truncate();

        const { accessToken } = await getClientCredentialsToken(admin);
        adminAccessToken = accessToken;

        userWallet = await signupWithAddress(userEmail, userPassword);
        userAccessToken = await getAuthCodeToken(user, 'openid user', userEmail, userPassword);

        await signupWithAddress(userEmail2, userPassword2);
        dashboardAccessToken = await getAuthCodeToken(user2, 'openid dashboard', userEmail2, userPassword2);

        testToken = await deployExampleToken();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: 0,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    poolAddress = res.body.address;
                    done();
                });
        });
    });

    describe('GET /account (encrypted)', () => {
        it('HTTP 200 with address and encrypted private key', async (done) => {
            user.get('/v1/account')
                .set({ Authorization: userAccessToken })
                .end((err, res) => {
                    expect(res.status).toBe(200);

                    const pKey = decryptString(res.body.privateKey, 'mellon');
                    const web3 = getProvider(NetworkProvider.Test);

                    decryptedWallet = web3.eth.accounts.privateKeyToAccount(pKey);

                    try {
                        decryptString(res.body.privateKey, 'wrongpassword');
                    } catch (err) {
                        expect(err.toString()).toEqual('Error: Unsupported state or unable to authenticate data');
                    }

                    expect(isAddress(decryptedWallet.address)).toBe(true);
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
                .send({ call, nonce, sig, newAddress })
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

        // it('HTTP 200 show new member address for old member address', async (done) => {
        //     user.get('/v1/members/' + tempAddress)
        //         .set({ AssetPool: poolAddress, Authorization: userAccessToken })
        //         .end((err, res) => {
        //             expect(res.status).toBe(200);
        //             expect(res.body.address).toBe(newAddress);
        //             done();
        //         });
        // });
    });
});
