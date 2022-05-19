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
    const title = 'Welcome Package',
        slug = 'welcome-package';

    let adminAccessToken: string,
        userAccessToken: string,
        dashboardAccessToken: string,
        poolAddress: string,
        withdrawDocumentId: string,
        withdrawPollID: string,
        tokenAddress: string,
        userWallet: Account;

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

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: NetworkProvider.Main,
                    token: tokenAddress,
                })
                .expect((res: request.Response) => {
                    expect(isAddress(res.body.address)).toBe(true);
                    poolAddress = res.body.address;
                })
                .expect(201, done);
        });
    });

    describe('POST /members/:address', () => {
        let redirectURL = '';

        it('HTTP 302 when member is added', (done) => {
            user.post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    redirectURL = res.headers.location;
                })
                .expect(302, done);
        });

        it('HTTP 200 for the redirect', (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(res.body.token.balance).toEqual(tokenTotalSupply);
                })
                .expect(200, done);
        });
    });

    describe('Make deposit into pool', () => {
        it('Approve for infinite amount', async () => {
            const testToken = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', tokenAddress);
            const tx = await testToken.methods.approve(poolAddress, MaxUint256).send({ from: userWallet.address });
            const event: any = Object.values(tx.events).filter((e: any) => e.event === 'Approval')[0];
            expect(event.returnValues.owner).toEqual(userWallet.address);
            expect(event.returnValues.spender).toEqual(poolAddress);
            expect(event.returnValues.value).toEqual(MaxUint256);
        });

        it('POST /deposits 201', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'deposit',
                [toWei(String(tokenTotalSupply))],
                userWallet,
            );
            await user
                .post('/v1/deposits')
                .set({ Authorization: userAccessToken, AssetPool: poolAddress })
                .send({ call, nonce, sig, amount: tokenTotalSupply })
                .expect(200);
        });
    });

    describe('GET /asset_pools/:address', () => {
        it('HTTP 200 and expose pool information', (done) => {
            user.get('/v1/asset_pools/' + poolAddress)
                .set({ AssetPool: poolAddress, Authorization: dashboardAccessToken })
                .expect(async ({ body }: request.Response) => {
                    expect(body.address).toEqual(poolAddress);
                    expect(isAddress(body.token.address)).toEqual(true);
                    expect(body.token.totalSupply).toBe(tokenTotalSupply);
                    expect(body.token.poolBalance).toBe(97500000); // Total supply - 2.5% protocol fee on deposit
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/', () => {
        it('HTTP 302 when reward is added', (done) => {
            user.post('/v1/rewards/')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .send({
                    title,
                    slug,
                    withdrawAmount: rewardWithdrawAmount,
                    withdrawDuration: rewardWithdrawDuration,
                    rewardWithdrawUnlockDate: rewardWithdrawUnlockDate,
                })
                .expect(async (res: request.Response) => {
                    expect(res.body.id).toEqual(1);
                })
                .expect(201, done);
        });
    });

    describe('GET /rewards/:id', () => {
        it('HTTP 200 when successful', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(200, done);
        });

        it('HTTP 404 if reward can not be found', (done) => {
            user.get('/v1/rewards/2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(404, done);
        });

        it('HTTP 400 if the id parameter is invalid', (done) => {
            user.get('/v1/rewards/id_invalid')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(400, done);
        });
    });

    describe('GET /rewards/:id (after finalizing)', () => {
        it('HTTP 200 and return updated withdrawAmount and state 1', (done) => {
            user.get('/v1/rewards/1')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.state).toEqual(1);
                    expect(res.body.title).toEqual(title);
                    expect(res.body.slug).toEqual(slug);
                    expect(res.body.withdrawAmount).toEqual(rewardWithdrawAmount);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/claim', () => {
        it('HTTP 302 when tx is handled', async () => {
            await user
                .post('/v1/rewards/1/claim')
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .send()
                .expect(200);
        });

        it('HTTP 200 after return state Pending', (done) => {
            user.get('/v1/withdrawals?member=' + userWallet.address + '&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    const index = res.body.results.length - 1;
                    const withdrawal = res.body.results[index];
                    expect(withdrawal.state).toEqual(0);
                    expect(withdrawal.amount).toEqual(rewardWithdrawAmount);
                    expect(withdrawal.unlockDate).not.toBe(undefined);
                })
                .expect(200, done);
        });
    });

    describe('POST /rewards/:id/give', () => {
        it('HTTP 200 when tx is handled', (done) => {
            user.post('/v1/rewards/1/give')
                .send({
                    member: userWallet.address,
                })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async ({ body }: request.Response) => {
                    expect(body.id).toBeDefined();
                    expect(body.sub).toEqual(sub2);
                    expect(body.amount).toEqual(rewardWithdrawAmount);
                    expect(body.state).toEqual(0);
                    expect(body.createdAt).toBeDefined();
                    expect(body.withdrawalId).toEqual(2);
                    expect(body.unlockDate).not.toBe(undefined);

                    withdrawDocumentId = body.id;
                    withdrawPollID = body.withdrawalId;
                })
                .expect(200, done);
        });
    });

    describe('POST /withdrawals/:id/withdraw', () => {
        beforeAll(async () => {
            await timeTravel(rewardWithdrawDuration);
        });

        it('HTTP 302 and redirect to withdrawal', async () => {
            const { call, nonce, sig } = await signMethod(
                poolAddress,
                'withdrawPollFinalize',
                [withdrawPollID],
                userWallet,
            );

            await user
                .post('/v1/relay/call')
                .send({
                    call,
                    nonce,
                    sig,
                })
                .set({ AssetPool: poolAddress, Authorization: userAccessToken })
                .expect(200);
        });

        it('HTTP 200 and return state Withdrawn', (done) => {
            user.get(`/v1/withdrawals/${withdrawDocumentId}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(({ body }: request.Response) => {
                    expect(body.id).toBeDefined();
                    expect(body.amount).toEqual(rewardWithdrawAmount);
                    expect(body.sub).toEqual(sub2);
                    expect(body.withdrawalId).toEqual(2);
                    expect(body.state).toEqual(1);
                    expect(body.unlockDate).not.toBe(undefined);
                })
                .expect(200, done);
        });

        it('HTTP 200 and have the minted amount balance again', (done) => {
            user.get('/v1/members/' + userWallet.address)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.token.balance).toBe(rewardWithdrawAmount);
                })
                .expect(200, done);
        });
    });

    describe('GET /asset_pools/:address (after withdraw)', () => {
        it('HTTP 200 and have decreased balance', (done) => {
            user.get(`/v1/asset_pools/${poolAddress}`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    // Total supply - 2.5% = 250000 deposit fee - 1000 token reward - 2.5% = 25 withdraw fee
                    expect(res.body.token.poolBalance).toBe(97498975);
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals (before proposed withdrawal)', () => {
        it('HTTP 200 and returns 2 items', (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(2);
                })
                .expect(200, done);
        });
    });

    describe('GET /withdrawals for withdrawn state', () => {
        it('HTTP 200 and returns 1 items', (done) => {
            user.get('/v1/withdrawals?state=1&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 2 item for state = 0', (done) => {
            user.get('/v1/withdrawals?state=0&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 0 items for state = 0 and rewardId = 1 since rewardId 2 does not exist.', (done) => {
            user.get('/v1/withdrawals?state=0&rewardId=2&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 1 item for state = 1 and rewardId = 1', (done) => {
            user.get('/v1/withdrawals?state=1&rewardId=1&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 1 item state = 1 and rewardId = 1 and member address', (done) => {
            user.get(`/v1/withdrawals?member=${userWallet.address}&state=1&rewardId=1&page=1&limit=2`)
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(1);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 0 items for unknown rewardId', (done) => {
            user.get('/v1/withdrawals?state=1&rewardId=2&page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(0);
                })
                .expect(200, done);
        });

        it('HTTP 200 and returns 2 items for page=1 and limit=2', (done) => {
            user.get('/v1/withdrawals?page=1&limit=2')
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.results.length).toBe(2);
                    expect(res.body.previous).toBeUndefined();
                })
                .expect(200, done);
        });
    });
});
