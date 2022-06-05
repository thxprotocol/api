import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { Account } from 'web3-core';
import { toWei } from 'web3-utils';
import { timeTravel, signMethod, createWallet } from '@/util/jest/network';
import {
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    rewardWithdrawUnlockDate,
    userWalletPrivateKey2,
    sub2,
    tokenName,
    tokenSymbol,
    tokenTotalSupply,
    MaxUint256,
} from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getContract, getContractFromName } from '@/config/contracts';
import { currentVersion } from '@thxnetwork/artifacts';
import { assertEvent, parseLogs } from '@/util/events';
import TransactionService from '@/services/TransactionService';

const user = request.agent(app);

describe('Default Pool', () => {

    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        tokenAddress: string,
        userWallet: Account,
        poolId: string;

    beforeAll(async () => {
        await beforeAllCallback();

        userWallet = createWallet(userWalletPrivateKey2);

        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        userAccessToken = getToken('openid user deposits:read deposits:write');
    });

    afterAll(afterAllCallback);

    describe('Existing ERC20 contract', () => {
        it('TokenDeployed event', async () => {
            const tokenFactory = getContract(NetworkProvider.Main, 'TokenFactory', currentVersion);
            const { receipt } = await TransactionService.send(
                tokenFactory.options.address,
                tokenFactory.methods.deployLimitedSupplyToken(
                    tokenName,
                    tokenSymbol,
                    userWallet.address,
                    toWei(String(tokenTotalSupply)),
                ),
                NetworkProvider.Main,
            );
            const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
            tokenAddress = event.args.token;
        });
    });

    describe('POST /pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: tokenAddress,
                })
                .expect((res: request.Response) => {
                    poolId = res.body._id;
                })
                .expect(201, done);
        });

        it('HTTP 201 (success)', (done) => {
            user.get(`/v1/pools/${poolId}`)
                .set('Authorization', dashboardAccessToken)
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(200, done);
        });
    });

    describe('GET /transactions', () => {
        it('HTTP 200 and returns 2 items', (done) => {
            user.get(`/v1/transactions?page=1&limit=2`)
                .set('Authorization', dashboardAccessToken)
                .set({ 'X-PoolAddress': poolAddress })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(2);
                })
                .expect(200, done);
        });
    });
});
