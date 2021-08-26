import request from 'supertest';
import server from '../../src/server';
import { NetworkProvider, sendTransaction } from '../../src/util/network';
import db from '../../src/util/database';
import { voter, deployExampleToken, signupWithAddress } from './lib/network';
import { rewardWithdrawAmount, rewardWithdrawDuration, userEmail, userPassword } from './lib/constants';
import {
    getAccessToken,
    getAuthCode,
    getAuthHeaders,
    registerClientCredentialsClient,
    registerDashboardClient,
    registerWalletClient,
} from './lib/registerClient';
import { solutionContract } from '../../src/util/network';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

const user = request(server);
const http2 = request.agent(server);
const http3 = request.agent(server);

describe('Rate Limit', () => {
    let poolAddress: string,
        adminAccessToken: string,
        dashboardAccessToken: string,
        userAccessToken: string,
        testToken: Contract;

    beforeAll(async () => {
        await db.truncate();

        const credentials = await registerClientCredentialsClient(user);

        adminAccessToken = credentials.accessToken;

        testToken = await deployExampleToken();

        // Create an account
        // await user.post('/v1/signup').set({ Authorization: adminAccessToken }).send({
        //     address: voter.address,
        //     email: 'test.api.bot@thx.network',
        //     password: 'mellon',
        //     confirmPassword: 'mellon',
        // });
        const voter = await signupWithAddress('test.api.bot@thx.network', 'mellon');

        const walletClient = await registerWalletClient(user);
        const walletHeaders = await getAuthHeaders(http2, walletClient, 'openid user email offline_access');
        const walletAuthCode = await getAuthCode(http2, walletHeaders, walletClient, {
            email: 'test.api.bot@thx.network',
            password: 'mellon',
        });

        const dashboardClient = await registerDashboardClient(user);
        const dashboardHeaders = await getAuthHeaders(http3, dashboardClient, 'openid dashboard');
        const dashboardAuthCode = await getAuthCode(http3, dashboardHeaders, dashboardClient, {
            email: userEmail,
            password: userPassword,
        });

        userAccessToken = await getAccessToken(http2, walletClient, walletAuthCode);
        dashboardAccessToken = await getAccessToken(http3, dashboardClient, dashboardAuthCode);

        // Create an asset pool
        const res = await user
            .post('/v1/asset_pools')
            .set({ Authorization: dashboardAccessToken })
            .send({
                network: 0,
                token: {
                    address: testToken.options.address,
                },
            });

        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        const assetPool = solutionContract(NetworkProvider.Test, poolAddress);
        const amount = toWei(rewardWithdrawAmount.toString());

        await sendTransaction(
            testToken.options.address,
            testToken.methods.approve(poolAddress, toWei(rewardWithdrawAmount.toString())),
            NetworkProvider.Test,
        );
        await sendTransaction(assetPool.options.address, assetPool.methods.deposit(amount), NetworkProvider.Test);

        // Create a reward
        await user.post('/v1/rewards/').set({ AssetPool: poolAddress, Authorization: adminAccessToken }).send({
            withdrawAmount: rewardWithdrawAmount,
            withdrawDuration: rewardWithdrawDuration,
        });

        // Add a member
        await user
            .post('/v1/members')
            .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
            .send({ address: voter.address });
    });

    describe('POST /reward/:id/give (5x)', () => {
        it('HTTP 200', async (done) => {
            for (let i = 0; i < 5; i++) {
                const { status } = await user
                    .post('/v1/rewards/1/give')
                    .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                    .send({
                        member: voter.address,
                    });
                expect(status).toBe(200);
            }
            done();
        });
    });

    describe('POST /reward/:id/give ', () => {
        it('HTTP 429 (Too Many Request)', async (done) => {
            const { status } = await user
                .post('/v1/rewards/1/give')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    member: voter.address,
                });
            expect(status).toBe(429);
            done();
        });
    });

    describe('POST /reward/:id/give (200 when window passes)', () => {
        it('HTTP 200', async (done) => {
            const { status } = await user
                .post('/v1/rewards/1/give')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    member: voter.address,
                });
            expect(status).toBe(200);
            done();
        });
    });
});
