import request from 'supertest';
import server from '../../src/server';
import { NetworkProvider, sendTransaction } from '../../src/util/network';
import db from '../../src/util/database';
import { timeTravel, signMethod, deployExampleToken, signupWithAddress } from './lib/network';
import {
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    userEmail,
    userPassword,
    userEmail2,
    userPassword2,
    rewardId,
    requestUris,
    redirectUris,
    postLogoutRedirectUris,
} from './lib/constants';
import { solutionContract } from '../../src/util/network';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getAuthCodeToken } from './lib/authorizationCode';

const user = request.agent(server);
const user2 = request.agent(server);

describe('Widgets', () => {
    let poolAddress: string, dashboardAccessToken: string, widgetAccessToken: string, testToken: Contract, rat: string;

    beforeAll(async () => {
        await db.truncate();

        await signupWithAddress(userEmail, userPassword);
        widgetAccessToken = await getAuthCodeToken(user, 'openid user widget', userEmail, userPassword);

        await signupWithAddress(userEmail2, userPassword2);
        dashboardAccessToken = await getAuthCodeToken(user2, 'openid dashboard', userEmail2, userPassword2);

        testToken = await deployExampleToken();

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

        // Configure the default poll durations
        await user
            .patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
            .send({
                rewardPollDuration,
                proposeWithdrawPollDuration,
            });

        // Create a reward
        await user.post('/v1/rewards/').set({ AssetPool: poolAddress, Authorization: dashboardAccessToken }).send({
            withdrawAmount: rewardWithdrawAmount,
            withdrawDuration: rewardWithdrawDuration,
        });
    });

    describe('POST /widgets/', () => {
        it('HTTP 200', async (done) => {
            const { status } = await user
                .post('/v1/widgets/')
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .send({
                    metadata: {
                        rewardId,
                        poolAddress,
                    },
                    requestUris,
                    redirectUris,
                    postLogoutRedirectUris,
                });
            expect(status).toBe(201);
            done();
        });
    });

    describe('GET /widgets', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user
                .get('/v1/widgets?asset_pool=' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken });
            expect(status).toBe(200);
            expect(body.length).toBe(1);
            rat = body[0];
            done();
        });
    });

    describe('GET /widgets/:rat', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user
                .get('/v1/widgets/' + rat)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken });
            expect(status).toBe(200);
            expect(body.requestUris).toBe(requestUris);
            expect(body.clientId).toBeDefined();
            expect(body.clientSecret).toBeDefined();
            expect(body.registrationAccessToken).toBe(rat);
            expect(body.metadata).toBe({
                rewardId,
                poolAddress,
            });
            done();
        });
    });
});
