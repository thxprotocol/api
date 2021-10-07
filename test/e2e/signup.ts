import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken, mockUpgradeAddress, signupWithAddress } from './lib/network';
import { userEmail, userEmail2, userPassword, userPassword2 } from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { getClientCredentialsToken } from './lib/clientCredentials';
import { getAuthCodeToken } from './lib/authorizationCode';
import { NetworkProvider } from '../../src/util/network';

const admin = request(server);
const user = request.agent(server);
const user2 = request.agent(server);

describe('Signup', () => {
    let poolAddress: any,
        dashboardAccessToken: string,
        testToken: Contract,
        walletAccessToken: string,
        adminAccessToken: string,
        userAddress: string;

    beforeAll(async () => {
        await db.truncate();

        const { accessToken } = await getClientCredentialsToken(admin);
        adminAccessToken = accessToken;

        await signupWithAddress(userEmail2, userPassword2);
        dashboardAccessToken = await getAuthCodeToken(user2, 'openid dashboard', userEmail2, userPassword2);

        testToken = await deployExampleToken();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 200', async (done) => {
            user.post('/v1/asset_pools')
                .set({ Authorization: dashboardAccessToken })
                .send({
                    network: NetworkProvider.Test,
                    token: {
                        address: testToken.options.address,
                    },
                })
                .end(async (err, res) => {
                    console.log(res.body);
                    expect(res.status).toBe(201);
                    poolAddress = res.body.address;
                    done();
                });
        });
    });

    describe('POST /signup (+ membership)', () => {
        it('HTTP 200', async (done) => {
            user.post('/v1/signup')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    email: userEmail,
                    password: userPassword,
                    confirmPassword: userPassword,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    userAddress = res.body.address;
                    done();
                });
        });
    });

    describe('GET /members/:address', () => {
        it('HTTP 200 if OK', (done) => {
            user.get('/v1/members/' + userAddress)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    // describe('POST /gas_station/upgrade_address', () => {
    //     it('HTTP 200 if OK', (done) => {
    //         const nonce = '',
    //             call = '',
    //             sig = '';

    //         user.post('/v1/gas_station/upgrade_address')
    //             .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
    //             .send({
    //                 newAddress: '',
    //                 nonce,
    //                 call,
    //                 sig,
    //             })
    //             .end(async (err, res) => {
    //                 expect(res.status).toBe(200);
    //                 done();
    //             });
    //     });
    // });

    describe('GET /account', () => {
        beforeAll(async () => {
            // remove encoded private key to simulate upgrade_address
            await mockUpgradeAddress(userEmail);

            walletAccessToken = await getAuthCodeToken(user, 'openid user', userEmail, userPassword);
        });

        it('HTTP 200 if OK', (done) => {
            user.get('/v1/account')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.memberships[0]).toBe(poolAddress);
                    expect(res.body.erc20[0].network).toBe(NetworkProvider.Test);
                    expect(res.body.erc20[0].address).toBe(testToken.options.address);

                    done();
                });
        });
    });
});
