import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { deployExampleToken } from './lib/network';
import {
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    rewardId,
    requestUris,
    redirectUris,
    postLogoutRedirectUris,
    sub,
    account,
} from './lib/constants';
import { Contract } from 'web3-eth-contract';
import { getToken } from './lib/jwt';
import { mockPath, mockStart } from './lib/mock';

const user = request.agent(server);

describe('Widgets', () => {
    let poolAddress: string,
        dashboardAccessToken: string,
        widgetAccessToken: string,
        testToken: Contract,
        clientId: string;

    beforeAll(async () => {
        await db.truncate();

        testToken = await deployExampleToken();
        widgetAccessToken = getToken('openid user widget');
        dashboardAccessToken = getToken('openid dashboard');

        mockStart();
        mockPath('post', '/account', 200, function () {
            if (poolAddress) account.memberships[0] = poolAddress;
            return account;
        });
        mockPath('get', `/account/${sub}`, 200, function () {
            if (poolAddress) account.memberships[0] = poolAddress;
            return account;
        });

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
            clientId = body[0];
            done();
        });
    });

    describe('GET /widgets/:clientId', () => {
        it('HTTP 200', async (done) => {
            const { body, status } = await user
                .get('/v1/widgets/' + clientId)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken });
            expect(status).toBe(200);
            expect(body.requestUris[0]).toBe(requestUris[0]);
            expect(body.clientId).toBeDefined();
            expect(body.clientSecret).toBeDefined();
            expect(body.metadata.rewardId).toBe(rewardId);
            expect(body.metadata.poolAddress).toBe(poolAddress);
            done();
        });
    });
});
